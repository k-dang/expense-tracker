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
  ImportPostResult,
} from "@/lib/types/api";

export async function uploadImportAction(
  _previousState: ImportPostResult | null,
  formData: FormData,
): Promise<ImportPostResult> {
  const uploadedFile = formData.get("file");

  if (!(uploadedFile instanceof File)) {
    return {
      status: "failed",
      errors: [
        { row: 0, field: "file", message: "Missing file in form-data." },
      ],
    };
  }

  try {
    const bytes = new Uint8Array(await uploadedFile.arrayBuffer());
    const result = await processImportFile({
      filename: uploadedFile.name,
      contentType: uploadedFile.type,
      bytes,
    });

    updateTag("transactions");
    updateTag("imports");
    return result;
  } catch {
    return {
      status: "failed",
      errors: [{ row: 0, field: "file", message: "Upload failed. Try again." }],
    };
  }
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
