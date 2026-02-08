import { and, count, desc, gte, lte, sql, sum } from "drizzle-orm";
import type { db as defaultDb } from "@/db/index";
import { transactionsTable } from "@/db/schema";
import type { DateRange } from "@/lib/dashboard/date-range";
import type {
  DashboardCategoryBreakdownItem,
  DashboardMonthlyTrendItem,
  DashboardResponse,
  DashboardTopVendorItem,
  RecentTransaction,
} from "@/lib/types/api";

export type DbClient = typeof defaultDb;

export async function getDashboardData(
  db: DbClient,
  range: DateRange,
): Promise<DashboardResponse> {
  const rangeFilter = and(
    gte(transactionsTable.txnDate, range.from),
    lte(transactionsTable.txnDate, range.to),
  );

  const [totalsRow, monthlyRows, categoryRows, vendorRows, recentRows] =
    await Promise.all([
      db
        .select({
          totalSpendCents: sum(transactionsTable.amountCents),
          transactionCount: count(transactionsTable.id),
        })
        .from(transactionsTable)
        .where(rangeFilter),
      db
        .select({
          month: sql<string>`substr(${transactionsTable.txnDate}, 1, 7)`,
          totalCents: sum(transactionsTable.amountCents),
        })
        .from(transactionsTable)
        .where(rangeFilter)
        .groupBy(sql`substr(${transactionsTable.txnDate}, 1, 7)`)
        .orderBy(sql`substr(${transactionsTable.txnDate}, 1, 7)`),
      db
        .select({
          category: transactionsTable.category,
          totalCents: sum(transactionsTable.amountCents),
        })
        .from(transactionsTable)
        .where(rangeFilter)
        .groupBy(transactionsTable.category)
        .orderBy(desc(sum(transactionsTable.amountCents))),
      db
        .select({
          vendor: transactionsTable.vendor,
          totalCents: sum(transactionsTable.amountCents),
          count: count(transactionsTable.id),
        })
        .from(transactionsTable)
        .where(rangeFilter)
        .groupBy(transactionsTable.vendor)
        .orderBy(desc(sum(transactionsTable.amountCents)))
        .limit(8),
      db
        .select({
          id: transactionsTable.id,
          txnDate: transactionsTable.txnDate,
          vendor: transactionsTable.vendor,
          category: transactionsTable.category,
          amountCents: transactionsTable.amountCents,
        })
        .from(transactionsTable)
        .where(rangeFilter)
        .orderBy(
          desc(transactionsTable.txnDate),
          desc(transactionsTable.createdAt),
        )
        .limit(10),
    ]);

  const totalSpendCents = Number(totalsRow[0]?.totalSpendCents ?? 0);
  const transactionCount = Number(totalsRow[0]?.transactionCount ?? 0);

  const monthlyTrend: DashboardMonthlyTrendItem[] = monthlyRows.map((row) => ({
    month: row.month,
    totalCents: Number(row.totalCents ?? 0),
  }));

  const categoryBreakdown: DashboardCategoryBreakdownItem[] = categoryRows.map(
    (row) => {
      const totalCents = Number(row.totalCents ?? 0);
      const percent = totalSpendCents === 0 ? 0 : totalCents / totalSpendCents;
      return {
        category: row.category,
        totalCents,
        percent,
      };
    },
  );

  const topVendors: DashboardTopVendorItem[] = vendorRows.map((row) => ({
    vendor: row.vendor,
    totalCents: Number(row.totalCents ?? 0),
    count: Number(row.count ?? 0),
  }));

  const recentTransactions: RecentTransaction[] = recentRows.map((row) => ({
    id: row.id,
    txnDate: row.txnDate,
    vendor: row.vendor,
    category: row.category,
    amountCents: row.amountCents,
  }));

  return {
    totals: {
      totalSpendCents,
      transactionCount,
      averageSpendCents:
        transactionCount === 0
          ? 0
          : Math.round(totalSpendCents / transactionCount),
    },
    monthlyTrend,
    categoryBreakdown,
    topVendors,
    recentTransactions,
  };
}
