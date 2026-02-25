import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { and, count, desc, asc, eq, inArray, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { expensesTable } from "@/db/schema";

export type ExpenseFilters = {
  search?: string;
  category?: string;
  sortBy?: "date" | "amount" | "description" | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function listExpenses(filters: ExpenseFilters = {}) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");

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
    conditions.push(like(expensesTable.description, `%${search}%`));
  }

  if (category) {
    conditions.push(eq(expensesTable.category, category));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = {
    date: expensesTable.txnDate,
    amount: expensesTable.amountCents,
    description: expensesTable.description,
    category: expensesTable.category,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;
  const offset = (page - 1) * pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: expensesTable.id,
        txnDate: expensesTable.txnDate,
        description: expensesTable.description,
        category: expensesTable.category,
        amountCents: expensesTable.amountCents,
      })
      .from(expensesTable)
      .where(whereClause)
      .orderBy(orderFn(sortColumn), desc(expensesTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count(expensesTable.id) })
      .from(expensesTable)
      .where(whereClause),
  ]);

  return {
    expenses: rows,
    totalCount: Number(totalRows[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export type ExpenseListItem = Awaited<
  ReturnType<typeof listExpenses>
>["expenses"][number];

export async function updateExpenseCategory(
  expenseId: string,
  newCategory: string,
) {
  await db
    .update(expensesTable)
    .set({ category: newCategory })
    .where(eq(expensesTable.id, expenseId));
}

export async function bulkUpdateExpenseCategories(
  expenseIds: string[],
  newCategory: string,
) {
  if (expenseIds.length === 0) return 0;

  const result = await db
    .update(expensesTable)
    .set({ category: newCategory })
    .where(inArray(expensesTable.id, expenseIds));

  return result.rowsAffected;
}

export async function applyRuleToMatchingExpenses(
  descriptionPattern: string,
  newCategory: string,
) {
  const normalized = descriptionPattern.toLowerCase();
  const result = await db
    .update(expensesTable)
    .set({ category: newCategory })
    .where(eq(sql`lower(${expensesTable.description})`, normalized));

  return result.rowsAffected;
}

export async function getDistinctCategories() {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");

  const rows = await db
    .select({ category: expensesTable.category })
    .from(expensesTable)
    .groupBy(expensesTable.category)
    .orderBy(asc(expensesTable.category));

  return rows.map((r) => r.category);
}

export async function countExpensesByDescription(description: string) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");

  const normalized = description.toLowerCase();
  const rows = await db
    .select({ count: count(expensesTable.id) })
    .from(expensesTable)
    .where(eq(sql`lower(${expensesTable.description})`, normalized));

  return Number(rows[0]?.count ?? 0);
}

export async function createExpense(input: {
  txnDate: string;
  description: string;
  amountCents: number;
  category: string;
}) {
  const id = randomUUID();
  await db.insert(expensesTable).values({
    id,
    txnDate: input.txnDate,
    description: input.description,
    amountCents: input.amountCents,
    category: input.category,
    currency: "CAD",
    fingerprint: randomUUID(),
    importId: null,
  });
  return id;
}

export async function deleteExpenses(expenseIds: string[]) {
  if (expenseIds.length === 0) return 0;
  const result = await db
    .delete(expensesTable)
    .where(inArray(expensesTable.id, expenseIds));
  return result.rowsAffected;
}
