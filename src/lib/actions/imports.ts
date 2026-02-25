"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import {
  deleteImportById,
  importSelectedDuplicates,
  listDuplicatesByImportId,
  processImportFile,
} from "@/db/queries/imports";
import type { ImportDuplicateItem } from "@/db/queries/imports";
import {
  DEFAULT_PROCESSOR_ID,
  getProcessor,
} from "@/lib/imports/processors/registry";
import type {
  ImportDeleteResult,
  ImportDuplicatesResult,
  ImportFileResult,
  ImportPostResult,
} from "@/lib/types/api";

const MAX_FILES_PER_UPLOAD = 10;

const uploadFilesSchema = z
  .array(z.instanceof(File))
  .min(1, { message: "Missing file in form-data." })
  .max(MAX_FILES_PER_UPLOAD, {
    message: `You can upload up to ${MAX_FILES_PER_UPLOAD} CSV files at once.`,
  });

const deleteImportSchema = z.object({
  importId: z.string().trim().min(1, "Import id is required."),
});

const importDuplicatesSchema = z
  .object({
    importId: z.string().trim().min(1),
    duplicateIds: z.array(z.string().trim()),
  })
  .refine((data) => data.duplicateIds.length > 0, "No duplicates selected.");

const fetchDuplicatesSchema = z.object({
  importId: z.string().trim().min(1),
});

export async function uploadImportAction(
  _previousState: ImportPostResult | null,
  formData: FormData,
): Promise<ImportPostResult> {
  const rawProcessorId = formData.get("processorId");
  const processorId =
    typeof rawProcessorId === "string" && rawProcessorId.length > 0
      ? rawProcessorId
      : DEFAULT_PROCESSOR_ID;

  const processor = getProcessor(processorId);
  if (!processor) {
    return {
      status: "failed",
      totalFiles: 0,
      succeededFiles: 0,
      failedFiles: 0,
      totalRows: 0,
      insertedRows: 0,
      duplicateRows: 0,
      files: [],
      errors: [
        {
          row: 0,
          field: "file",
          message: `Unknown file processor: "${processorId}".`,
        },
      ],
    };
  }

  const uploadedFiles = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File);

  const parsed = uploadFilesSchema.safeParse(uploadedFiles);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid file input.";
    return {
      status: "failed",
      totalFiles: 0,
      succeededFiles: 0,
      failedFiles: 0,
      totalRows: 0,
      insertedRows: 0,
      duplicateRows: 0,
      files: [],
      errors: [{ row: 0, field: "file", message: msg }],
    };
  }

  const fileResults: ImportFileResult[] = [];
  for (const file of parsed.data) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await processImportFile({
        filename: file.name,
        contentType: file.type,
        bytes,
        processor,
      });
      fileResults.push(result);
    } catch {
      fileResults.push({
        filename: file.name,
        status: "failed",
        errors: [
          { row: 0, field: "file", message: "Upload failed. Try again." },
        ],
      });
    }
  }

  const succeededFiles = fileResults.filter(
    (result) => result.status === "succeeded",
  );
  const failedFiles = fileResults.length - succeededFiles.length;
  const totalRows = succeededFiles.reduce(
    (sum, item) => sum + item.totalRows,
    0,
  );
  const insertedRows = succeededFiles.reduce(
    (sum, item) => sum + item.insertedRows,
    0,
  );
  const duplicateRows = succeededFiles.reduce(
    (sum, item) => sum + item.duplicateRows,
    0,
  );
  const status =
    succeededFiles.length === fileResults.length
      ? "succeeded"
      : succeededFiles.length > 0
        ? "partial"
        : "failed";

  if (succeededFiles.length > 0) {
    updateTag("expenses");
    updateTag("imports");
  }

  return {
    status,
    totalFiles: fileResults.length,
    succeededFiles: succeededFiles.length,
    failedFiles,
    totalRows,
    insertedRows,
    duplicateRows,
    files: fileResults,
    errors: [],
  };
}

export async function fetchDuplicatesAction(
  importId: string,
): Promise<ImportDuplicateItem[]> {
  const parsed = fetchDuplicatesSchema.safeParse({ importId });
  if (!parsed.success) return [];
  return listDuplicatesByImportId({ importId: parsed.data.importId });
}

export async function importDuplicatesAction(
  importId: string,
  duplicateIds: string[],
): Promise<ImportDuplicatesResult> {
  const parsed = importDuplicatesSchema.safeParse({ importId, duplicateIds });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "No duplicates selected.";
    return { status: "failed", error: msg };
  }

  try {
    const importedCount = await importSelectedDuplicates({
      importId: parsed.data.importId,
      duplicateIds: parsed.data.duplicateIds,
    });
    updateTag("expenses");
    updateTag("imports");
    return { status: "succeeded", importedCount };
  } catch {
    return { status: "failed", error: "Failed to import duplicates." };
  }
}

export async function deleteImportAction(
  _previousState: ImportDeleteResult | null,
  formData: FormData,
): Promise<ImportDeleteResult> {
  const rawImportId = formData.get("importId");
  const input = {
    importId: typeof rawImportId === "string" ? rawImportId : "",
  };
  const parsed = deleteImportSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Import id is required.";
    return { status: "failed", error: msg };
  }

  try {
    const result = await deleteImportById({ importId: parsed.data.importId });
    if (result.status === "succeeded") {
      updateTag("expenses");
      updateTag("imports");
    }
    return result;
  } catch {
    return { status: "failed", error: "Failed to delete import." };
  }
}
