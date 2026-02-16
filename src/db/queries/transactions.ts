import { cacheLife, cacheTag } from "next/cache";
import { and, count, desc, asc, eq, inArray, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactionsTable } from "@/db/schema";

export type TransactionFilters = {
  search?: string;
  category?: string;
  sortBy?: "date" | "amount" | "description" | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function listTransactions(filters: TransactionFilters = {}) {
  "use cache";
  cacheLife("max");
  cacheTag("transactions");

  const {
    search,
    category,
    sortBy = "date",
    sortOrder = "desc",
    page = 1,
    pageSize = 50,
  } = filters;

  const conditions = [];

  if (search) {
    conditions.push(like(transactionsTable.description, `%${search}%`));
  }

  if (category) {
    conditions.push(eq(transactionsTable.category, category));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = {
    date: transactionsTable.txnDate,
    amount: transactionsTable.amountCents,
    description: transactionsTable.description,
    category: transactionsTable.category,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;
  const offset = (page - 1) * pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: transactionsTable.id,
        txnDate: transactionsTable.txnDate,
        description: transactionsTable.description,
        category: transactionsTable.category,
        amountCents: transactionsTable.amountCents,
      })
      .from(transactionsTable)
      .where(whereClause)
      .orderBy(orderFn(sortColumn), desc(transactionsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable)
      .where(whereClause),
  ]);

  return {
    transactions: rows,
    totalCount: Number(totalRows[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export type TransactionListItem = Awaited<
  ReturnType<typeof listTransactions>
>["transactions"][number];

export async function updateTransactionCategory(
  txnId: string,
  newCategory: string,
) {
  await db
    .update(transactionsTable)
    .set({ category: newCategory })
    .where(eq(transactionsTable.id, txnId));
}

export async function bulkUpdateTransactionCategories(
  txnIds: string[],
  newCategory: string,
) {
  if (txnIds.length === 0) return 0;

  const result = await db
    .update(transactionsTable)
    .set({ category: newCategory })
    .where(inArray(transactionsTable.id, txnIds));

  return result.rowsAffected;
}

export async function applyRuleToMatchingTransactions(
  descriptionPattern: string,
  newCategory: string,
) {
  const normalized = descriptionPattern.toLowerCase();
  const result = await db
    .update(transactionsTable)
    .set({ category: newCategory })
    .where(eq(sql`lower(${transactionsTable.description})`, normalized));

  return result.rowsAffected;
}

export async function getDistinctCategories() {
  "use cache";
  cacheLife("max");
  cacheTag("transactions");

  const rows = await db
    .select({ category: transactionsTable.category })
    .from(transactionsTable)
    .groupBy(transactionsTable.category)
    .orderBy(asc(transactionsTable.category));

  return rows.map((r) => r.category);
}

export async function countTransactionsByDescription(description: string) {
  "use cache";
  cacheLife("max");
  cacheTag("transactions");

  const normalized = description.toLowerCase();
  const rows = await db
    .select({ count: count(transactionsTable.id) })
    .from(transactionsTable)
    .where(eq(sql`lower(${transactionsTable.description})`, normalized));

  return Number(rows[0]?.count ?? 0);
}
