import { randomUUID } from "node:crypto";
import { count, desc, eq } from "drizzle-orm";
import type { db as defaultDb } from "@/db/index";
import { importsTable, transactionsTable } from "@/db/schema";
import { readCsvRows, validateRow } from "@/lib/imports/core";
import type {
  ImportDeleteFailure,
  ImportDeleteSuccess,
  ImportError,
  ImportHistoryItem,
  ImportPostFailure,
  ImportPostSuccess,
} from "@/lib/types/api";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export type DbClient = typeof defaultDb;

export async function listImports(db: DbClient): Promise<ImportHistoryItem[]> {
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

export async function processImportFile(options: {
  db: DbClient;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<ImportPostSuccess | ImportPostFailure> {
  const fileValidationError = validateFileInput(options);
  if (fileValidationError) {
    await recordFailedImport({
      db: options.db,
      filename: options.filename,
      message: fileValidationError.message,
    });
    return { status: "failed", errors: [fileValidationError] };
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let csvText: string;

  try {
    csvText = decoder.decode(options.bytes);
  } catch {
    const decodeError: ImportError = {
      row: 0,
      field: "file",
      message: "File must be valid UTF-8 text.",
    };

    await recordFailedImport({
      db: options.db,
      filename: options.filename,
      message: decodeError.message,
    });
    return { status: "failed", errors: [decodeError] };
  }

  const parsed = readCsvRows(csvText);
  if ("field" in parsed) {
    await recordFailedImport({
      db: options.db,
      filename: options.filename,
      message: parsed.message,
    });
    return { status: "failed", errors: [parsed] };
  }

  const validationErrors: ImportError[] = [];
  const validated = parsed.rows.flatMap((row, index) => {
    const result = validateRow({
      rowNumber: index + 2,
      date: row.date,
      vendor: row.vendor,
      amount: row.amount,
      category: row.category,
    });

    if ("error" in result) {
      validationErrors.push(result.error);
      return [];
    }

    return [result.value];
  });

  if (validationErrors.length > 0) {
    await recordFailedImport({
      db: options.db,
      filename: options.filename,
      message: validationErrors[0]?.message ?? "Validation failed.",
      rowCountTotal: parsed.rows.length,
    });
    return { status: "failed", errors: validationErrors };
  }

  const importId = randomUUID();

  options.db.transaction((tx) => {
    tx.insert(importsTable)
      .values({
        id: importId,
        filename: options.filename,
        rowCountTotal: parsed.rows.length,
        rowCountInserted: 0,
        rowCountDuplicates: 0,
        status: "succeeded",
        errorMessage: null,
      })
      .run();

    tx.insert(transactionsTable)
      .values(
        validated.map((txn) => ({
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
    const duplicateRows = parsed.rows.length - insertedRows;

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
    totalRows: parsed.rows.length,
    insertedRows,
    duplicateRows,
    status: "succeeded",
  };
}

export async function deleteImportById(options: {
  db: DbClient;
  importId: string;
}): Promise<ImportDeleteSuccess | ImportDeleteFailure> {
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

function validateFileInput(options: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): ImportError | null {
  if (!options.bytes.length) {
    return { row: 0, field: "file", message: "File is empty." };
  }

  if (options.bytes.length > MAX_FILE_BYTES) {
    return {
      row: 0,
      field: "file",
      message: `File exceeds max size of ${MAX_FILE_BYTES} bytes.`,
    };
  }

  const lower = options.filename.toLowerCase();
  const hasCsvExt = lower.endsWith(".csv");
  const csvMimeTypes = new Set([
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
  ]);

  if (!hasCsvExt && !csvMimeTypes.has(options.contentType)) {
    return {
      row: 0,
      field: "file",
      message: "File must be a CSV.",
    };
  }

  return null;
}
