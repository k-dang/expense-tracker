import { cacheLife, cacheTag } from "next/cache";
import { and, count, desc, gte, lte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { transactionsTable } from "@/db/schema";
import type { DateRange } from "@/lib/dashboard/date-range";

function getRangeFilter(range: DateRange) {
  return and(
    gte(transactionsTable.txnDate, range.from),
    lte(transactionsTable.txnDate, range.to),
  );
}

export async function getDashboardTotals(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("transactions");
  const rangeFilter = getRangeFilter(range);

  const totalsRow = await db
    .select({
      totalSpendCents: sum(transactionsTable.amountCents),
      transactionCount: count(transactionsTable.id),
    })
    .from(transactionsTable)
    .where(rangeFilter);

  const totalSpendCents = Number(totalsRow[0]?.totalSpendCents ?? 0);
  const transactionCount = Number(totalsRow[0]?.transactionCount ?? 0);

  return {
    totalSpendCents,
    transactionCount,
    averageSpendCents:
      transactionCount === 0
        ? 0
        : Math.round(totalSpendCents / transactionCount),
  };
}

export type DashboardTotals = Awaited<ReturnType<typeof getDashboardTotals>>;

export async function getDashboardMonthlyTrend(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("transactions");
  const rangeFilter = getRangeFilter(range);

  const monthlyRows = await db
    .select({
      month: sql<string>`substr(${transactionsTable.txnDate}, 1, 7)`,
      totalCents: sum(transactionsTable.amountCents),
    })
    .from(transactionsTable)
    .where(rangeFilter)
    .groupBy(sql`substr(${transactionsTable.txnDate}, 1, 7)`)
    .orderBy(sql`substr(${transactionsTable.txnDate}, 1, 7)`);

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
  cacheTag("transactions");
  const rangeFilter = getRangeFilter(range);

  const categoryRows = await db
    .select({
      category: transactionsTable.category,
      totalCents: sum(transactionsTable.amountCents),
    })
    .from(transactionsTable)
    .where(rangeFilter)
    .groupBy(transactionsTable.category)
    .orderBy(desc(sum(transactionsTable.amountCents)));

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
  cacheTag("transactions");
  const rangeFilter = getRangeFilter(range);

  const descriptionRows = await db
    .select({
      description: transactionsTable.description,
      totalCents: sum(transactionsTable.amountCents),
      count: count(transactionsTable.id),
    })
    .from(transactionsTable)
    .where(rangeFilter)
    .groupBy(transactionsTable.description)
    .orderBy(desc(sum(transactionsTable.amountCents)))
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

export async function getDashboardRecentTransactions(range: DateRange) {
  "use cache";
  cacheLife("max");
  cacheTag("transactions");
  const rangeFilter = getRangeFilter(range);

  const recentRows = await db
    .select({
      id: transactionsTable.id,
      txnDate: transactionsTable.txnDate,
      description: transactionsTable.description,
      category: transactionsTable.category,
      amountCents: transactionsTable.amountCents,
    })
    .from(transactionsTable)
    .where(rangeFilter)
    .orderBy(desc(transactionsTable.txnDate), desc(transactionsTable.createdAt))
    .limit(10);

  return recentRows.map((row) => ({
    id: row.id,
    txnDate: row.txnDate,
    description: row.description,
    category: row.category,
    amountCents: row.amountCents,
  }));
}

export type DashboardRecentTransactionItem = Awaited<
  ReturnType<typeof getDashboardRecentTransactions>
>[number];
