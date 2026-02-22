import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { incomesTable } from "@/db/schema";

export type IncomeFilters = {
  source?: string;
  sortBy?: "date" | "amount" | "source";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function listIncomes(filters: IncomeFilters = {}) {
  "use cache";
  cacheLife("max");
  cacheTag("income");

  const {
    source,
    sortBy = "date",
    sortOrder = "desc",
    page = 1,
    pageSize = 50,
  } = filters;

  const conditions = [];

  if (source) {
    conditions.push(eq(incomesTable.source, source));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = {
    date: incomesTable.incomeDate,
    amount: incomesTable.amountCents,
    source: incomesTable.source,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;
  const offset = (page - 1) * pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: incomesTable.id,
        incomeDate: incomesTable.incomeDate,
        source: incomesTable.source,
        amountCents: incomesTable.amountCents,
      })
      .from(incomesTable)
      .where(whereClause)
      .orderBy(orderFn(sortColumn), desc(incomesTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count(incomesTable.id) })
      .from(incomesTable)
      .where(whereClause),
  ]);

  return {
    incomes: rows,
    totalCount: Number(totalRows[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export type IncomeListItem = Awaited<
  ReturnType<typeof listIncomes>
>["incomes"][number];

export async function createIncome(input: {
  incomeDate: string;
  amountCents: number;
  source: string;
}) {
  const id = randomUUID();
  await db.insert(incomesTable).values({
    id,
    incomeDate: input.incomeDate,
    amountCents: input.amountCents,
    source: input.source,
    currency: "CAD",
    fingerprint: randomUUID(),
    importId: null,
  });
  return id;
}

export async function updateIncome(
  id: string,
  input: {
    incomeDate?: string;
    amountCents?: number;
    source?: string;
  },
) {
  await db.update(incomesTable).set(input).where(eq(incomesTable.id, id));
}

export async function deleteIncomes(ids: string[]) {
  if (ids.length === 0) return 0;
  const result = await db
    .delete(incomesTable)
    .where(inArray(incomesTable.id, ids));
  return result.rowsAffected;
}

export async function getDistinctSources() {
  "use cache";
  cacheLife("max");
  cacheTag("income");

  const rows = await db
    .select({ source: incomesTable.source })
    .from(incomesTable)
    .groupBy(incomesTable.source)
    .orderBy(asc(incomesTable.source));

  return rows.map((r) => r.source);
}
