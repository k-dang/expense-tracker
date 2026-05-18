import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { importDuplicatesTable, importsTable, incomesTable } from "@/db/schema";
import { processIncomeImportFileInput } from "@/lib/imports/process-income-import-file";
import { sha256Hex } from "@/lib/imports/sha256-hex";
import type { ImportFileResult } from "@/lib/types/api";

const INCOME_CSV_PROCESSOR_ID = "income-csv";
const INCOME_CSV_PROCESSOR_LABEL = "Income CSV";

export async function processIncomeImportFile(options: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<ImportFileResult> {
  const fileBytes = options.bytes;
  const fileSizeBytes = fileBytes.byteLength;
  const fileSha256 = sha256Hex(fileBytes);
  const provenanceValues = {
    processorId: INCOME_CSV_PROCESSOR_ID,
    processorLabel: INCOME_CSV_PROCESSOR_LABEL,
    contentType: options.contentType,
    fileSizeBytes,
    fileSha256,
  };

  const processed = processIncomeImportFileInput({
    filename: options.filename,
    contentType: options.contentType,
    bytes: fileBytes,
  });
  if (processed.status === "failed") {
    await db.insert(importsTable).values({
      id: randomUUID(),
      filename: options.filename,
      rowCountTotal: processed.rowCountTotal ?? 0,
      rowCountInserted: 0,
      rowCountDuplicates: 0,
      status: "failed",
      errorMessage: processed.errors[0]?.message ?? "Import failed.",
      type: "income",
      ...provenanceValues,
    });
    return {
      filename: options.filename,
      status: "failed",
      errors: processed.errors,
    };
  }

  const importId = randomUUID();

  const allFingerprints = processed.rows.map((r) => r.fingerprint);
  const existingFingerprints = new Set<string>();
  const BATCH_SIZE = 500;
  for (let i = 0; i < allFingerprints.length; i += BATCH_SIZE) {
    const batch = allFingerprints.slice(i, i + BATCH_SIZE);
    const rows = await db
      .select({ fingerprint: incomesTable.fingerprint })
      .from(incomesTable)
      .where(inArray(incomesTable.fingerprint, batch));
    for (const r of rows) existingFingerprints.add(r.fingerprint);
  }

  const seenInFile = new Set<string>();
  const rowsToInsert: typeof processed.rows = [];
  const duplicateRows: ((typeof processed.rows)[number] & {
    reason: "cross_import" | "within_file";
  })[] = [];

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
      type: "income",
      ...provenanceValues,
    });

    if (rowsToInsert.length > 0) {
      await tx.insert(incomesTable).values(
        rowsToInsert.map((row) => ({
          id: randomUUID(),
          incomeDate: row.incomeDate,
          amountCents: row.amountCents,
          source: row.source,
          currency: "CAD",
          fingerprint: row.fingerprint,
          importId,
          sourceRowNumber: row.sourceRowNumber,
        })),
      );
    }

    if (duplicateRows.length > 0) {
      await tx.insert(importDuplicatesTable).values(
        duplicateRows.map((dup) => ({
          id: randomUUID(),
          importId,
          txnDate: dup.incomeDate,
          description: dup.source,
          amountCents: dup.amountCents,
          category: dup.source,
          currency: "CAD",
          fingerprint: dup.fingerprint,
          reason: dup.reason,
          type: "income" as const,
          sourceRowNumber: dup.sourceRowNumber,
        })),
      );
    }
  });

  return {
    filename: options.filename,
    importId,
    totalRows: processed.totalRows,
    insertedRows: rowsToInsert.length,
    duplicateRows: duplicateRows.length,
    status: "succeeded",
  };
}
