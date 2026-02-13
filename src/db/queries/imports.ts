import { randomUUID } from "node:crypto";
import { count, desc, eq, inArray } from "drizzle-orm";
import type { db as defaultDb } from "@/db/index";
import {
  importDuplicatesTable,
  importsTable,
  transactionsTable,
} from "@/db/schema";
import { processImportFileInput } from "@/lib/imports/process-import-file";
import type { ImportDeleteResult, ImportPostResult } from "@/lib/types/api";

export type DbClient = typeof defaultDb;

export async function listImports(db: DbClient) {
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
  db: DbClient;
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
      db: options.db,
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
    const rows = options.db
      .select({ fingerprint: transactionsTable.fingerprint })
      .from(transactionsTable)
      .where(inArray(transactionsTable.fingerprint, batch))
      .all();
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

  options.db.transaction((tx) => {
    tx.insert(importsTable)
      .values({
        id: importId,
        filename: options.filename,
        rowCountTotal: processed.totalRows,
        rowCountInserted: rowsToInsert.length,
        rowCountDuplicates: duplicateRows.length,
        status: "succeeded",
        errorMessage: null,
      })
      .run();

    if (rowsToInsert.length > 0) {
      tx.insert(transactionsTable)
        .values(
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
        )
        .run();
    }

    if (duplicateRows.length > 0) {
      tx.insert(importDuplicatesTable)
        .values(
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
        )
        .run();
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
  db: DbClient;
  importId: string;
}): Promise<ImportDeleteResult> {
  const existing = await options.db
    .select({ id: importsTable.id })
    .from(importsTable)
    .where(eq(importsTable.id, options.importId))
    .limit(1);

  if (!existing[0]) {
    return { status: "failed", error: "Import not found." };
  }

  const deletedTransactionCount = options.db.transaction((tx) => {
    const existingTransactionCount = tx
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable)
      .where(eq(transactionsTable.importId, options.importId))
      .get();

    tx.delete(importDuplicatesTable)
      .where(eq(importDuplicatesTable.importId, options.importId))
      .run();

    tx.delete(transactionsTable)
      .where(eq(transactionsTable.importId, options.importId))
      .run();

    tx.delete(importsTable).where(eq(importsTable.id, options.importId)).run();

    return Number(existingTransactionCount?.count ?? 0);
  });

  return {
    status: "succeeded",
    importId: options.importId,
    deletedTransactionCount,
  };
}

export async function listDuplicatesByImportId(options: {
  db: DbClient;
  importId: string;
}) {
  return options.db
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

export function importSelectedDuplicates(options: {
  db: DbClient;
  importId: string;
  duplicateIds: string[];
}): number {
  const { db: dbClient, importId, duplicateIds } = options;
  if (duplicateIds.length === 0) return 0;

  return dbClient.transaction((tx) => {
    // Fetch selected duplicate rows
    const rows = tx
      .select()
      .from(importDuplicatesTable)
      .where(inArray(importDuplicatesTable.id, duplicateIds))
      .all();

    if (rows.length === 0) return 0;

    // Insert into transactions with unique fingerprints
    tx.insert(transactionsTable)
      .values(
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
      )
      .run();

    // Delete from duplicates table
    tx.delete(importDuplicatesTable)
      .where(inArray(importDuplicatesTable.id, duplicateIds))
      .run();

    // Update import counters
    const current = tx
      .select({
        rowCountInserted: importsTable.rowCountInserted,
        rowCountDuplicates: importsTable.rowCountDuplicates,
      })
      .from(importsTable)
      .where(eq(importsTable.id, importId))
      .get();

    if (current) {
      tx.update(importsTable)
        .set({
          rowCountInserted: current.rowCountInserted + rows.length,
          rowCountDuplicates: current.rowCountDuplicates - rows.length,
        })
        .where(eq(importsTable.id, importId))
        .run();
    }

    return rows.length;
  });
}

async function recordFailedImport(options: {
  db: DbClient;
  filename: string;
  message: string;
  rowCountTotal?: number;
}) {
  await options.db.insert(importsTable).values({
    id: randomUUID(),
    filename: options.filename,
    rowCountTotal: options.rowCountTotal ?? 0,
    rowCountInserted: 0,
    rowCountDuplicates: 0,
    status: "failed",
    errorMessage: options.message,
  });
}
