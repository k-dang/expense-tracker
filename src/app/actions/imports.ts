"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/index";
import { deleteImportById, processImportFile } from "@/db/queries/imports";
import type { ImportDeleteResult, ImportPostResult } from "@/lib/types/api";

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
      db,
      filename: uploadedFile.name,
      contentType: uploadedFile.type,
      bytes,
    });

    revalidatePath("/");
    return result;
  } catch {
    return {
      status: "failed",
      errors: [{ row: 0, field: "file", message: "Upload failed. Try again." }],
    };
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
    const result = await deleteImportById({ db, importId: normalizedImportId });
    if (result.status === "succeeded") {
      revalidatePath("/");
    }
    return result;
  } catch {
    return { status: "failed", error: "Failed to delete import." };
  }
}
