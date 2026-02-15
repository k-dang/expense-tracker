import { randomUUID } from "node:crypto";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  importDuplicatesTable,
  importsTable,
  transactionsTable,
} from "@/db/schema";
import { processImportFileInput } from "@/lib/imports/process-import-file";
import type { ImportDeleteResult, ImportPostResult } from "@/lib/types/api";

export async function listImports() {
  return db
    .select({
      id: importsTable.id,
      filename: importsTable.filename,
      uploadedAt: importsTable.uploadedAt,
      rowCountTotal: importsTable.rowCountTotal,
      rowCountInserted: importsTable.rowCountInserted,
      rowCountDuplicates: importsTable.rowCountDuplicates,
      status: importsTable.status,
      errorMessage: importsTable.errorMessage,
    })
    .from(importsTable)
    .orderBy(desc(importsTable.uploadedAt));
}

export type ImportListItem = Awaited<ReturnType<typeof listImports>>[number];

export async function processImportFile(options: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<ImportPostResult> {
  const processed = processImportFileInput({
    filename: options.filename,
    contentType: options.contentType,
    bytes: options.bytes,
  });
  if (processed.status === "failed") {
    await recordFailedImport({
      filename: options.filename,
      message: processed.errors[0]?.message ?? "Import failed.",
      rowCountTotal: processed.rowCountTotal,
    });
    return { status: "failed", errors: processed.errors };
  }

  const importId = randomUUID();

  // Collect all fingerprints and query existing ones in batches
  const allFingerprints = processed.rows.map((r) => r.fingerprint);
  const existingFingerprints = new Set<string>();
  const BATCH_SIZE = 500;
  for (let i = 0; i < allFingerprints.length; i += BATCH_SIZE) {
    const batch = allFingerprints.slice(i, i + BATCH_SIZE);
    const rows = await db
      .select({ fingerprint: transactionsTable.fingerprint })
      .from(transactionsTable)
      .where(inArray(transactionsTable.fingerprint, batch));
    for (const r of rows) existingFingerprints.add(r.fingerprint);
  }

  // Partition rows into inserts vs duplicates
  const seenInFile = new Set<string>();
  const rowsToInsert: typeof processed.rows = [];
  const duplicateRows: {
    txnDate: string;
    vendor: string;
    amountCents: number;
    category: string;
    fingerprint: string;
    reason: "cross_import" | "within_file";
  }[] = [];

  for (const row of processed.rows) {
    if (existingFingerprints.has(row.fingerprint)) {
      duplicateRows.push({ ...row, reason: "cross_import" });
    } else if (seenInFile.has(row.fingerprint)) {
      duplicateRows.push({ ...row, reason: "within_file" });
    } else {
      seenInFile.add(row.fingerprint);
      rowsToInsert.push(row);
    }
  }

  await db.transaction(async (tx) => {
    await tx.insert(importsTable).values({
      id: importId,
      filename: options.filename,
      rowCountTotal: processed.totalRows,
      rowCountInserted: rowsToInsert.length,
      rowCountDuplicates: duplicateRows.length,
      status: "succeeded",
      errorMessage: null,
    });

    if (rowsToInsert.length > 0) {
      await tx.insert(transactionsTable).values(
        rowsToInsert.map((txn) => ({
          id: randomUUID(),
          txnDate: txn.txnDate,
          vendor: txn.vendor,
          amountCents: txn.amountCents,
          category: txn.category,
          currency: "CAD",
          fingerprint: txn.fingerprint,
          importId,
        })),
      );
    }

    if (duplicateRows.length > 0) {
      await tx.insert(importDuplicatesTable).values(
        duplicateRows.map((dup) => ({
          id: randomUUID(),
          importId,
          txnDate: dup.txnDate,
          vendor: dup.vendor,
          amountCents: dup.amountCents,
          category: dup.category,
          currency: "CAD",
          fingerprint: dup.fingerprint,
          reason: dup.reason,
        })),
      );
    }
  });

  return {
    importId,
    totalRows: processed.totalRows,
    insertedRows: rowsToInsert.length,
    duplicateRows: duplicateRows.length,
    status: "succeeded",
  };
}

export async function deleteImportById(options: {
  importId: string;
}): Promise<ImportDeleteResult> {
  const existing = await db
    .select({ id: importsTable.id })
    .from(importsTable)
    .where(eq(importsTable.id, options.importId))
    .limit(1);

  if (!existing[0]) {
    return { status: "failed", error: "Import not found." };
  }

  const deletedTransactionCount = await db.transaction(async (tx) => {
    const existingTransactionCount = await tx
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable)
      .where(eq(transactionsTable.importId, options.importId))
      .limit(1);

    await tx
      .delete(importDuplicatesTable)
      .where(eq(importDuplicatesTable.importId, options.importId));

    await tx
      .delete(transactionsTable)
      .where(eq(transactionsTable.importId, options.importId));

    await tx.delete(importsTable).where(eq(importsTable.id, options.importId));

    return Number(existingTransactionCount[0]?.count ?? 0);
  });

  return {
    status: "succeeded",
    importId: options.importId,
    deletedTransactionCount,
  };
}

export async function listDuplicatesByImportId(options: { importId: string }) {
  return db
    .select({
      id: importDuplicatesTable.id,
      txnDate: importDuplicatesTable.txnDate,
      vendor: importDuplicatesTable.vendor,
      amountCents: importDuplicatesTable.amountCents,
      category: importDuplicatesTable.category,
      currency: importDuplicatesTable.currency,
      reason: importDuplicatesTable.reason,
    })
    .from(importDuplicatesTable)
    .where(eq(importDuplicatesTable.importId, options.importId));
}

export type ImportDuplicateItem = Awaited<
  ReturnType<typeof listDuplicatesByImportId>
>[number];

export async function importSelectedDuplicates(options: {
  importId: string;
  duplicateIds: string[];
}): Promise<number> {
  const { importId, duplicateIds } = options;
  if (duplicateIds.length === 0) return 0;

  return db.transaction(async (tx) => {
    // Fetch selected duplicate rows
    const rows = await tx
      .select()
      .from(importDuplicatesTable)
      .where(inArray(importDuplicatesTable.id, duplicateIds));

    if (rows.length === 0) return 0;

    // Insert into transactions with unique fingerprints
    await tx.insert(transactionsTable).values(
      rows.map((row) => ({
        id: randomUUID(),
        txnDate: row.txnDate,
        vendor: row.vendor,
        amountCents: row.amountCents,
        category: row.category,
        currency: row.currency,
        fingerprint: `${row.fingerprint}-${randomUUID()}`,
        importId,
      })),
    );

    // Delete from duplicates table
    await tx
      .delete(importDuplicatesTable)
      .where(inArray(importDuplicatesTable.id, duplicateIds));

    // Update import counters
    const current = await tx
      .select({
        rowCountInserted: importsTable.rowCountInserted,
        rowCountDuplicates: importsTable.rowCountDuplicates,
      })
      .from(importsTable)
      .where(eq(importsTable.id, importId))
      .limit(1);

    const currentRow = current[0];

    if (currentRow) {
      await tx
        .update(importsTable)
        .set({
          rowCountInserted: currentRow.rowCountInserted + rows.length,
          rowCountDuplicates: currentRow.rowCountDuplicates - rows.length,
        })
        .where(eq(importsTable.id, importId));
    }

    return rows.length;
  });
}

async function recordFailedImport(options: {
  filename: string;
  message: string;
  rowCountTotal?: number;
}) {
  await db.insert(importsTable).values({
    id: randomUUID(),
    filename: options.filename,
    rowCountTotal: options.rowCountTotal ?? 0,
    rowCountInserted: 0,
    rowCountDuplicates: 0,
    status: "failed",
    errorMessage: options.message,
  });
}
