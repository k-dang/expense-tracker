import { randomUUID } from "node:crypto";
import { count, desc, eq } from "drizzle-orm";
import type { db as defaultDb } from "@/db/index";
import { importsTable, transactionsTable } from "@/db/schema";
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

  options.db.transaction((tx) => {
    tx.insert(importsTable)
      .values({
        id: importId,
        filename: options.filename,
        rowCountTotal: processed.totalRows,
        rowCountInserted: 0,
        rowCountDuplicates: 0,
        status: "succeeded",
        errorMessage: null,
      })
      .run();

    tx.insert(transactionsTable)
      .values(
        processed.rows.map((txn) => ({
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
      .onConflictDoNothing({ target: transactionsTable.fingerprint })
      .run();

    const insertedRow = tx
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable)
      .where(eq(transactionsTable.importId, importId))
      .get();

    const insertedRows = Number(insertedRow?.count ?? 0);
    const duplicateRows = processed.totalRows - insertedRows;

    tx.update(importsTable)
      .set({
        rowCountInserted: insertedRows,
        rowCountDuplicates: duplicateRows,
      })
      .where(eq(importsTable.id, importId))
      .run();
  });

  const insertedImportRows = await options.db
    .select({
      rowCountInserted: importsTable.rowCountInserted,
      rowCountDuplicates: importsTable.rowCountDuplicates,
    })
    .from(importsTable)
    .where(eq(importsTable.id, importId))
    .limit(1);

  const insertedImport = insertedImportRows[0];

  const insertedRows = insertedImport?.rowCountInserted ?? 0;
  const duplicateRows = insertedImport?.rowCountDuplicates ?? 0;

  return {
    importId,
    totalRows: processed.totalRows,
    insertedRows,
    duplicateRows,
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
