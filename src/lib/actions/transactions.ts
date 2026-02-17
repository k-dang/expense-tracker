"use server";

import { updateTag } from "next/cache";
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

export async function updateCategoryAction(txnId: string, newCategory: string) {
  await updateTransactionCategory(txnId, newCategory);
  updateTag("transactions");
}

export async function bulkUpdateCategoryAction(
  txnIds: string[],
  newCategory: string,
) {
  if (txnIds.length === 0) return;
  await bulkUpdateTransactionCategories(txnIds, newCategory);
  updateTag("transactions");
}

export async function applyCategoryRuleAction(
  descriptionPattern: string,
  newCategory: string,
  applyToExisting: boolean,
) {
  await upsertCategoryRule(descriptionPattern, newCategory);
  updateTag("category-rules");

  if (applyToExisting) {
    await applyRuleToMatchingTransactions(descriptionPattern, newCategory);
    updateTag("transactions");
  }
}

export async function bulkApplyCategoryRulesAction(
  descriptionPatterns: string[],
  newCategory: string,
  applyToExisting: boolean,
) {
  for (const pattern of descriptionPatterns) {
    await upsertCategoryRule(pattern, newCategory);
  }
  updateTag("category-rules");

  if (applyToExisting) {
    for (const pattern of descriptionPatterns) {
      await applyRuleToMatchingTransactions(pattern, newCategory);
    }
    updateTag("transactions");
  }
}

export async function countMatchingTransactionsAction(
  description: string,
): Promise<number> {
  return countTransactionsByDescription(description);
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
  const rawDate = formData.get("date");
  const rawDescription = formData.get("description");
  const rawAmount = formData.get("amount");
  const rawCategory = formData.get("category");

  const errors: Record<string, string> = {};

  const date =
    typeof rawDate === "string" ? parseStrictDate(rawDate.trim()) : null;
  if (!date) {
    errors.date = "Valid date is required.";
  }

  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";
  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length > 150) {
    errors.description = "Description must be 150 characters or less.";
  }

  const amountStr = typeof rawAmount === "string" ? rawAmount.trim() : "";
  const amountNum = Number(amountStr);
  if (!amountStr || Number.isNaN(amountNum) || amountNum <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  const category = typeof rawCategory === "string" ? rawCategory.trim() : "";
  if (!category) {
    errors.category = "Category is required.";
  }

  if (Object.keys(errors).length > 0 || !date) {
    return { status: "error", errors };
  }

  const amountCents = Math.round(amountNum * 100);
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
  if (txnIds.length === 0) {
    return { status: "error" as const, error: "No transactions selected." };
  }

  try {
    const deletedCount = await deleteTransactions(txnIds);
    updateTag("transactions");
    return { status: "success" as const, deletedCount };
  } catch {
    return {
      status: "error" as const,
      error: "Failed to delete transactions.",
    };
  }
}
