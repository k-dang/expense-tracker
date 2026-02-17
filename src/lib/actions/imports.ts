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

function getBaseResult(
  overrides?: Partial<ImportPostResult>,
): ImportPostResult {
  return {
    status: "failed",
    totalFiles: 0,
    succeededFiles: 0,
    failedFiles: 0,
    totalRows: 0,
    insertedRows: 0,
    duplicateRows: 0,
    files: [],
    errors: [],
    ...overrides,
  };
}

function toUploadError(message: string): ImportPostResult["errors"][number] {
  return { row: 0, field: "file", message };
}

export async function uploadImportAction(
  _previousState: ImportPostResult | null,
  formData: FormData,
): Promise<ImportPostResult> {
  const uploadedFiles = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File);

  const parsed = uploadFilesSchema.safeParse(uploadedFiles);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid file input.";
    return getBaseResult({ errors: [toUploadError(msg)] });
  }

  const fileResults: ImportFileResult[] = [];
  for (const file of parsed.data) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await processImportFile({
        filename: file.name,
        contentType: file.type,
        bytes,
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
    updateTag("transactions");
    updateTag("imports");
  }

  return getBaseResult({
    status,
    totalFiles: fileResults.length,
    succeededFiles: succeededFiles.length,
    failedFiles,
    totalRows,
    insertedRows,
    duplicateRows,
    files: fileResults,
  });
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
    updateTag("transactions");
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
      updateTag("transactions");
      updateTag("imports");
    }
    return result;
  } catch {
    return { status: "failed", error: "Failed to delete import." };
  }
}
