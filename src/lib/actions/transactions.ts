"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { upsertCategoryRule } from "@/db/queries/category-rules";
import {
  updateTransactionCategory,
  bulkUpdateTransactionCategories,
  applyRuleToMatchingTransactions,
  countTransactionsByDescription,
  createTransaction,
  deleteTransactions,
} from "@/db/queries/transactions";
import { parseStrictDate } from "@/lib/date/utils";

const updateCategorySchema = z.object({
  txnId: z.string().trim().min(1, "Transaction ID is required."),
  newCategory: z.string().trim().min(1, "Category is required."),
});

const bulkUpdateCategorySchema = z.object({
  txnIds: z
    .array(z.string().trim())
    .min(1, "At least one transaction is required."),
  newCategory: z.string().trim().min(1, "Category is required."),
});

const applyCategoryRuleSchema = z.object({
  descriptionPattern: z
    .string()
    .trim()
    .min(1, "Description pattern is required."),
  newCategory: z.string().trim().min(1, "Category is required."),
  applyToExisting: z.boolean(),
});

const bulkApplyCategoryRulesSchema = z.object({
  descriptionPatterns: z
    .array(z.string().trim())
    .min(1, "At least one pattern is required."),
  newCategory: z.string().trim().min(1, "Category is required."),
  applyToExisting: z.boolean(),
});

const countMatchingSchema = z.object({
  description: z.string().trim(),
});

const createTransactionSchema = z
  .object({
    date: z.string().trim().min(1, "Valid date is required."),
    description: z
      .string()
      .trim()
      .min(1, "Description is required.")
      .max(150, "Description must be 150 characters or less."),
    amount: z.string().trim().min(1, "Amount must be a positive number."),
    category: z.string().trim().min(1, "Category is required."),
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
    description: data.description,
    amountCents: Math.round(Number(data.amount) * 100),
    category: data.category,
  }));

const deleteTransactionsSchema = z
  .object({ txnIds: z.array(z.string().trim()) })
  .refine((data) => data.txnIds.length > 0, "No transactions selected.");

export async function updateCategoryAction(txnId: string, newCategory: string) {
  const parsed = updateCategorySchema.safeParse({ txnId, newCategory });
  if (!parsed.success) return;
  await updateTransactionCategory(parsed.data.txnId, parsed.data.newCategory);
  updateTag("transactions");
}

export async function bulkUpdateCategoryAction(
  txnIds: string[],
  newCategory: string,
) {
  const parsed = bulkUpdateCategorySchema.safeParse({ txnIds, newCategory });
  if (!parsed.success) return;
  await bulkUpdateTransactionCategories(
    parsed.data.txnIds,
    parsed.data.newCategory,
  );
  updateTag("transactions");
}

export async function applyCategoryRuleAction(
  descriptionPattern: string,
  newCategory: string,
  applyToExisting: boolean,
) {
  const parsed = applyCategoryRuleSchema.safeParse({
    descriptionPattern,
    newCategory,
    applyToExisting,
  });
  if (!parsed.success) return;
  const {
    descriptionPattern: pattern,
    newCategory: cat,
    applyToExisting: apply,
  } = parsed.data;
  await upsertCategoryRule(pattern, cat);
  updateTag("category-rules");

  if (apply) {
    await applyRuleToMatchingTransactions(pattern, cat);
    updateTag("transactions");
  }
}

export async function bulkApplyCategoryRulesAction(
  descriptionPatterns: string[],
  newCategory: string,
  applyToExisting: boolean,
) {
  const parsed = bulkApplyCategoryRulesSchema.safeParse({
    descriptionPatterns,
    newCategory,
    applyToExisting,
  });
  if (!parsed.success) return;
  const {
    descriptionPatterns: patterns,
    newCategory: cat,
    applyToExisting: apply,
  } = parsed.data;
  for (const pattern of patterns) {
    await upsertCategoryRule(pattern, cat);
  }
  updateTag("category-rules");

  if (apply) {
    for (const pattern of patterns) {
      await applyRuleToMatchingTransactions(pattern, cat);
    }
    updateTag("transactions");
  }
}

export async function countMatchingTransactionsAction(
  description: string,
): Promise<number> {
  const parsed = countMatchingSchema.safeParse({ description });
  const desc = parsed.success ? parsed.data.description : "";
  return countTransactionsByDescription(desc);
}

export type CreateTransactionState = {
  status: "idle" | "success" | "error";
  errors?: Record<string, string>;
  txnId?: string;
} | null;

export async function createTransactionAction(
  _prevState: CreateTransactionState,
  formData: FormData,
): Promise<CreateTransactionState> {
  const raw = {
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    category: formData.get("category"),
  };
  const input = {
    date: typeof raw.date === "string" ? raw.date : "",
    description: typeof raw.description === "string" ? raw.description : "",
    amount: typeof raw.amount === "string" ? raw.amount : "",
    category: typeof raw.category === "string" ? raw.category : "",
  };

  const result = createTransactionSchema.safeParse(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && issue.message) errors[path] = issue.message;
    }
    return { status: "error", errors };
  }

  const { date, description, amountCents, category } = result.data;
  const txnId = await createTransaction({
    txnDate: date,
    description,
    amountCents,
    category,
  });

  updateTag("transactions");
  return { status: "success", txnId };
}

export async function deleteTransactionsAction(txnIds: string[]) {
  const parsed = deleteTransactionsSchema.safeParse({ txnIds });
  if (!parsed.success) {
    return {
      status: "error" as const,
      error: parsed.error.issues[0]?.message ?? "No transactions selected.",
    };
  }

  try {
    const deletedCount = await deleteTransactions(parsed.data.txnIds);
    updateTag("transactions");
    return { status: "success" as const, deletedCount };
  } catch {
    return {
      status: "error" as const,
      error: "Failed to delete transactions.",
    };
  }
}
