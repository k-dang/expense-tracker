"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createIncome, deleteIncomes, updateIncome } from "@/db/queries/income";
import { processIncomeImportFile } from "@/db/queries/income-imports";
import { parseStrictDate } from "@/lib/date/utils";
import type { ImportFileResult, ImportPostResult } from "@/lib/types/api";

const createIncomeSchema = z
  .object({
    date: z.string().trim().min(1, "Valid date is required."),
    amount: z.string().trim().min(1, "Amount must be a positive number."),
    source: z.string().trim().min(1, "Source is required."),
  })
  .refine((data) => parseStrictDate(data.date) !== null, {
    message: "Valid date is required.",
    path: ["date"],
  })
  .refine(
    (data) => {
      const n = Number(data.amount);
      return !Number.isNaN(n) && n > 0;
    },
    { message: "Amount must be a positive number.", path: ["amount"] },
  )
  .transform((data) => ({
    date: parseStrictDate(data.date) as string,
    amountCents: Math.round(Number(data.amount) * 100),
    source: data.source,
  }));

const updateIncomeSchema = z
  .object({
    id: z.string().trim().min(1, "Income ID is required."),
    date: z.string().trim().min(1, "Valid date is required."),
    amount: z.string().trim().min(1, "Amount must be a positive number."),
    source: z.string().trim().min(1, "Source is required."),
  })
  .refine((data) => parseStrictDate(data.date) !== null, {
    message: "Valid date is required.",
    path: ["date"],
  })
  .refine(
    (data) => {
      const n = Number(data.amount);
      return !Number.isNaN(n) && n > 0;
    },
    { message: "Amount must be a positive number.", path: ["amount"] },
  )
  .transform((data) => ({
    id: data.id,
    date: parseStrictDate(data.date) as string,
    amountCents: Math.round(Number(data.amount) * 100),
    source: data.source,
  }));

const deleteIncomesSchema = z
  .object({ ids: z.array(z.string().trim()) })
  .refine((data) => data.ids.length > 0, "No income entries selected.");

const MAX_FILES_PER_UPLOAD = 10;

const uploadFilesSchema = z
  .array(z.instanceof(File))
  .min(1, { message: "Missing file in form-data." })
  .max(MAX_FILES_PER_UPLOAD, {
    message: `You can upload up to ${MAX_FILES_PER_UPLOAD} CSV files at once.`,
  });

export type CreateIncomeState = {
  status: "idle" | "success" | "error";
  errors?: Record<string, string>;
  incomeId?: string;
} | null;

export async function createIncomeAction(
  _prevState: CreateIncomeState,
  formData: FormData,
): Promise<CreateIncomeState> {
  const raw = {
    date: formData.get("date"),
    amount: formData.get("amount"),
    source: formData.get("source"),
  };
  const input = {
    date: typeof raw.date === "string" ? raw.date : "",
    amount: typeof raw.amount === "string" ? raw.amount : "",
    source: typeof raw.source === "string" ? raw.source : "",
  };

  const result = createIncomeSchema.safeParse(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && issue.message) errors[path] = issue.message;
    }
    return { status: "error", errors };
  }

  const { date, amountCents, source } = result.data;
  const incomeId = await createIncome({
    incomeDate: date,
    amountCents,
    source,
  });

  updateTag("income");
  return { status: "success", incomeId };
}

export type UpdateIncomeState = {
  status: "idle" | "success" | "error";
  errors?: Record<string, string>;
} | null;

export async function updateIncomeAction(
  _prevState: UpdateIncomeState,
  formData: FormData,
): Promise<UpdateIncomeState> {
  const raw = {
    id: formData.get("id"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    source: formData.get("source"),
  };
  const input = {
    id: typeof raw.id === "string" ? raw.id : "",
    date: typeof raw.date === "string" ? raw.date : "",
    amount: typeof raw.amount === "string" ? raw.amount : "",
    source: typeof raw.source === "string" ? raw.source : "",
  };

  const result = updateIncomeSchema.safeParse(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && issue.message) errors[path] = issue.message;
    }
    return { status: "error", errors };
  }

  const { id, date, amountCents, source } = result.data;
  await updateIncome(id, {
    incomeDate: date,
    amountCents,
    source,
  });

  updateTag("income");
  return { status: "success" };
}

export async function deleteIncomesAction(ids: string[]) {
  const parsed = deleteIncomesSchema.safeParse({ ids });
  if (!parsed.success) {
    return {
      status: "error" as const,
      error: parsed.error.issues[0]?.message ?? "No income entries selected.",
    };
  }

  try {
    const deletedCount = await deleteIncomes(parsed.data.ids);
    updateTag("income");
    return { status: "success" as const, deletedCount };
  } catch {
    return {
      status: "error" as const,
      error: "Failed to delete income entries.",
    };
  }
}

export async function uploadIncomeImportAction(
  _previousState: ImportPostResult | null,
  formData: FormData,
): Promise<ImportPostResult> {
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
      const result = await processIncomeImportFile({
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
    updateTag("income");
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
