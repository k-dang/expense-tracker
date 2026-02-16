"use server";

import { updateTag } from "next/cache";
import { upsertCategoryRule } from "@/db/queries/category-rules";
import {
  updateTransactionCategory,
  bulkUpdateTransactionCategories,
  applyRuleToMatchingTransactions,
  countTransactionsByDescription,
} from "@/db/queries/transactions";

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

export async function countMatchingTransactionsAction(
  description: string,
): Promise<number> {
  return countTransactionsByDescription(description);
}
