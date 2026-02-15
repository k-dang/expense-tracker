"use server";

import { updateTag } from "next/cache";
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

export async function uploadImportAction(
  _previousState: ImportPostResult | null,
  formData: FormData,
): Promise<ImportPostResult> {
  const uploadedFiles = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File);

  if (uploadedFiles.length === 0) {
    return getBaseResult({
      errors: [
        { row: 0, field: "file", message: "Missing file in form-data." },
      ],
    });
  }

  if (uploadedFiles.length > MAX_FILES_PER_UPLOAD) {
    return getBaseResult({
      errors: [
        {
          row: 0,
          field: "file",
          message: `You can upload up to ${MAX_FILES_PER_UPLOAD} CSV files at once.`,
        },
      ],
    });
  }

  const fileResults: ImportFileResult[] = [];
  for (const file of uploadedFiles) {
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
  return listDuplicatesByImportId({ importId });
}

export async function importDuplicatesAction(
  importId: string,
  duplicateIds: string[],
): Promise<ImportDuplicatesResult> {
  if (!importId || duplicateIds.length === 0) {
    return { status: "failed", error: "No duplicates selected." };
  }

  try {
    const importedCount = await importSelectedDuplicates({
      importId,
      duplicateIds,
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
  const importId = typeof rawImportId === "string" ? rawImportId : "";
  const normalizedImportId = importId.trim();
  if (!normalizedImportId) {
    return { status: "failed", error: "Import id is required." };
  }

  try {
    const result = await deleteImportById({ importId: normalizedImportId });
    if (result.status === "succeeded") {
      updateTag("transactions");
      updateTag("imports");
    }
    return result;
  } catch {
    return { status: "failed", error: "Failed to delete import." };
  }
}
