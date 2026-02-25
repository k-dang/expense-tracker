import { cacheLife, cacheTag } from "next/cache";
import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { expensesTable, incomesTable } from "@/db/schema";
import type { DateRange } from "@/lib/dashboard/date-range";

function getRangeFilter(range: DateRange) {
  return and(
    gte(expensesTable.txnDate, range.from),
    lte(expensesTable.txnDate, range.to),
  );
}

export async function getDashboardTotals(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");
  const rangeFilter = getRangeFilter(range);

  const totalsRow = await db
    .select({
      totalSpendCents: sum(expensesTable.amountCents),
      expenseCount: count(expensesTable.id),
    })
    .from(expensesTable)
    .where(rangeFilter);

  const totalSpendCents = Number(totalsRow[0]?.totalSpendCents ?? 0);
  const expenseCount = Number(totalsRow[0]?.expenseCount ?? 0);

  return {
    totalSpendCents,
    expenseCount,
    averageSpendCents:
      expenseCount === 0 ? 0 : Math.round(totalSpendCents / expenseCount),
  };
}

export type DashboardTotals = Awaited<ReturnType<typeof getDashboardTotals>>;

export async function getDashboardMonthlyTrend(
  range: DateRange,
  category?: string,
) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");
  const rangeFilter = getRangeFilter(range);
  const whereClause = category
    ? and(rangeFilter, eq(expensesTable.category, category))
    : rangeFilter;

  const monthlyRows = await db
    .select({
      month: sql<string>`substr(${expensesTable.txnDate}, 1, 7)`,
      totalCents: sum(expensesTable.amountCents),
    })
    .from(expensesTable)
    .where(whereClause)
    .groupBy(sql`substr(${expensesTable.txnDate}, 1, 7)`)
    .orderBy(sql`substr(${expensesTable.txnDate}, 1, 7)`);

  return monthlyRows.map((row) => ({
    month: row.month,
    totalCents: Number(row.totalCents ?? 0),
  }));
}

export type DashboardMonthlyTrendItem = Awaited<
  ReturnType<typeof getDashboardMonthlyTrend>
>[number];

export async function getDashboardCategoryBreakdown(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");
  const rangeFilter = getRangeFilter(range);

  const categoryRows = await db
    .select({
      category: expensesTable.category,
      totalCents: sum(expensesTable.amountCents),
    })
    .from(expensesTable)
    .where(rangeFilter)
    .groupBy(expensesTable.category)
    .orderBy(desc(sum(expensesTable.amountCents)));

  const totalSpendCents = categoryRows.reduce(
    (total, row) => total + Number(row.totalCents ?? 0),
    0,
  );

  return categoryRows.map((row) => {
    const totalCents = Number(row.totalCents ?? 0);
    const percent = totalSpendCents === 0 ? 0 : totalCents / totalSpendCents;
    return {
      category: row.category,
      totalCents,
      percent,
    };
  });
}

export type DashboardCategoryBreakdownItem = Awaited<
  ReturnType<typeof getDashboardCategoryBreakdown>
>[number];

export async function getDashboardTopDescriptions(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");
  const rangeFilter = getRangeFilter(range);

  const descriptionRows = await db
    .select({
      description: expensesTable.description,
      totalCents: sum(expensesTable.amountCents),
      count: count(expensesTable.id),
    })
    .from(expensesTable)
    .where(rangeFilter)
    .groupBy(expensesTable.description)
    .orderBy(desc(sum(expensesTable.amountCents)))
    .limit(8);

  return descriptionRows.map((row) => ({
    description: row.description,
    totalCents: Number(row.totalCents ?? 0),
    count: Number(row.count ?? 0),
  }));
}

export type DashboardTopDescriptionItem = Awaited<
  ReturnType<typeof getDashboardTopDescriptions>
>[number];

export async function getDashboardRecentExpenses(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("expenses");
  const rangeFilter = getRangeFilter(range);

  const recentRows = await db
    .select({
      id: expensesTable.id,
      txnDate: expensesTable.txnDate,
      description: expensesTable.description,
      category: expensesTable.category,
      amountCents: expensesTable.amountCents,
    })
    .from(expensesTable)
    .where(rangeFilter)
    .orderBy(desc(expensesTable.txnDate), desc(expensesTable.createdAt))
    .limit(10);

  return recentRows.map((row) => ({
    id: row.id,
    txnDate: row.txnDate,
    description: row.description,
    category: row.category,
    amountCents: row.amountCents,
  }));
}

export type DashboardRecentExpenseItem = Awaited<
  ReturnType<typeof getDashboardRecentExpenses>
>[number];

function getIncomeRangeFilter(range: DateRange) {
  return and(
    gte(incomesTable.incomeDate, range.from),
    lte(incomesTable.incomeDate, range.to),
  );
}

export async function getDashboardIncomeTotals(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("income");
  const rangeFilter = getIncomeRangeFilter(range);

  const totalsRow = await db
    .select({
      totalIncomeCents: sum(incomesTable.amountCents),
      incomeCount: count(incomesTable.id),
    })
    .from(incomesTable)
    .where(rangeFilter);

  return {
    totalIncomeCents: Number(totalsRow[0]?.totalIncomeCents ?? 0),
    incomeCount: Number(totalsRow[0]?.incomeCount ?? 0),
  };
}

export type DashboardIncomeTotals = Awaited<
  ReturnType<typeof getDashboardIncomeTotals>
>;

export async function getDashboardMonthlyIncomeTrend(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("income");
  const rangeFilter = getIncomeRangeFilter(range);

  const monthlyRows = await db
    .select({
      month: sql<string>`substr(${incomesTable.incomeDate}, 1, 7)`,
      totalCents: sum(incomesTable.amountCents),
    })
    .from(incomesTable)
    .where(rangeFilter)
    .groupBy(sql`substr(${incomesTable.incomeDate}, 1, 7)`)
    .orderBy(sql`substr(${incomesTable.incomeDate}, 1, 7)`);

  return monthlyRows.map((row) => ({
    month: row.month,
    totalCents: Number(row.totalCents ?? 0),
  }));
}

export type DashboardMonthlyIncomeTrendItem = Awaited<
  ReturnType<typeof getDashboardMonthlyIncomeTrend>
>[number];
