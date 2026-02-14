import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  getDashboardCategoryBreakdown,
  getDashboardMonthlyTrend,
  getDashboardRecentTransactions,
  getDashboardTopVendors,
  getDashboardTotals,
} from "@/db/queries/dashboard";
import { importsTable, transactionsTable } from "@/db/schema";
import {
  getDefaultDashboardDateRange,
  resolveDashboardPageDateRange,
} from "@/lib/dashboard/date-range";
import { createTestDb } from "@/test/db";

describe("dashboard queries", () => {
  it("returns expected totals", async () => {
    const db = await createTestDb();
    const importId = randomUUID();

    await db.insert(importsTable).values({
      id: importId,
      filename: "seed.csv",
      rowCountTotal: 3,
      rowCountInserted: 3,
      rowCountDuplicates: 0,
      status: "succeeded",
      errorMessage: null,
    });

    await db.insert(transactionsTable).values([
      {
        id: randomUUID(),
        txnDate: "2025-01-01",
        vendor: "Store A",
        amountCents: 1000,
        category: "Food",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-01-15",
        vendor: "Store A",
        amountCents: 3000,
        category: "Food",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-02-01",
        vendor: "Store B",
        amountCents: 3000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
    ]);

    const totals = await getDashboardTotals(db, {
      from: "2025-01-01",
      to: "2025-02-28",
    });

    expect(totals.totalSpendCents).toBe(7000);
    expect(totals.transactionCount).toBe(3);
    expect(totals.averageSpendCents).toBe(2333);
  });

  it("returns expected monthly trend", async () => {
    const db = await createTestDb();
    const importId = randomUUID();

    await db.insert(importsTable).values({
      id: importId,
      filename: "seed.csv",
      rowCountTotal: 3,
      rowCountInserted: 3,
      rowCountDuplicates: 0,
      status: "succeeded",
      errorMessage: null,
    });

    await db.insert(transactionsTable).values([
      {
        id: randomUUID(),
        txnDate: "2025-01-01",
        vendor: "Store A",
        amountCents: 1000,
        category: "Food",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-01-15",
        vendor: "Store B",
        amountCents: 3000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-02-01",
        vendor: "Store C",
        amountCents: 2000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
    ]);

    const monthlyTrend = await getDashboardMonthlyTrend(db, {
      from: "2025-01-01",
      to: "2025-02-28",
    });

    expect(monthlyTrend).toEqual([
      { month: "2025-01", totalCents: 4000 },
      { month: "2025-02", totalCents: 2000 },
    ]);
  });

  it("returns expected category breakdown with percentages", async () => {
    const db = await createTestDb();
    const importId = randomUUID();

    await db.insert(importsTable).values({
      id: importId,
      filename: "seed.csv",
      rowCountTotal: 3,
      rowCountInserted: 3,
      rowCountDuplicates: 0,
      status: "succeeded",
      errorMessage: null,
    });

    await db.insert(transactionsTable).values([
      {
        id: randomUUID(),
        txnDate: "2025-01-01",
        vendor: "Store A",
        amountCents: 1000,
        category: "Food",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-01-15",
        vendor: "Store B",
        amountCents: 3000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-02-01",
        vendor: "Store C",
        amountCents: 2000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
    ]);

    const categoryBreakdown = await getDashboardCategoryBreakdown(db, {
      from: "2025-01-01",
      to: "2025-02-28",
    });

    expect(categoryBreakdown).toHaveLength(2);
    expect(categoryBreakdown[0]).toEqual({
      category: "Rent",
      totalCents: 5000,
      percent: 5 / 6,
    });
    expect(categoryBreakdown[1]).toEqual({
      category: "Food",
      totalCents: 1000,
      percent: 1 / 6,
    });
  });

  it("returns expected top vendors", async () => {
    const db = await createTestDb();
    const importId = randomUUID();

    await db.insert(importsTable).values({
      id: importId,
      filename: "seed.csv",
      rowCountTotal: 3,
      rowCountInserted: 3,
      rowCountDuplicates: 0,
      status: "succeeded",
      errorMessage: null,
    });

    await db.insert(transactionsTable).values([
      {
        id: randomUUID(),
        txnDate: "2025-01-01",
        vendor: "Store A",
        amountCents: 1000,
        category: "Food",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-01-15",
        vendor: "Store A",
        amountCents: 3000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-02-01",
        vendor: "Store B",
        amountCents: 2000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
    ]);

    const topVendors = await getDashboardTopVendors(db, {
      from: "2025-01-01",
      to: "2025-02-28",
    });

    expect(topVendors).toEqual([
      { vendor: "Store A", totalCents: 4000, count: 2 },
      { vendor: "Store B", totalCents: 2000, count: 1 },
    ]);
  });

  it("returns expected recent transactions", async () => {
    const db = await createTestDb();
    const importId = randomUUID();

    await db.insert(importsTable).values({
      id: importId,
      filename: "seed.csv",
      rowCountTotal: 3,
      rowCountInserted: 3,
      rowCountDuplicates: 0,
      status: "succeeded",
      errorMessage: null,
    });

    await db.insert(transactionsTable).values([
      {
        id: randomUUID(),
        txnDate: "2025-01-01",
        vendor: "Store A",
        amountCents: 1000,
        category: "Food",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-01-15",
        vendor: "Store B",
        amountCents: 3000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
      {
        id: randomUUID(),
        txnDate: "2025-02-01",
        vendor: "Store C",
        amountCents: 2000,
        category: "Rent",
        currency: "CAD",
        fingerprint: randomUUID(),
        importId,
      },
    ]);

    const recentTransactions = await getDashboardRecentTransactions(db, {
      from: "2025-01-01",
      to: "2025-02-28",
    });

    expect(recentTransactions).toHaveLength(3);
    expect(recentTransactions[0]?.txnDate).toBe("2025-02-01");
    expect(recentTransactions[1]?.txnDate).toBe("2025-01-15");
    expect(recentTransactions[2]?.txnDate).toBe("2025-01-01");
  });

  it("derives default range from current date", () => {
    const range = getDefaultDashboardDateRange(
      new Date("2026-02-07T00:00:00.000Z"),
    );
    expect(range.from).toBe("2025-01-01");
    expect(range.to).toBe("2026-02-28");
  });

  it("resolves page date range with fallback for invalid inputs", () => {
    expect(
      resolveDashboardPageDateRange({ from: "2025-01-10", to: "2025-02-10" }),
    ).toEqual({
      from: "2025-01-10",
      to: "2025-02-10",
    });

    const fallback = getDefaultDashboardDateRange();

    expect(
      resolveDashboardPageDateRange({ from: "2025-03-01", to: "2025-01-01" }),
    ).toEqual(fallback);
    expect(
      resolveDashboardPageDateRange({ from: "2025-01-01", to: "not-a-date" }),
    ).toEqual(fallback);
    expect(resolveDashboardPageDateRange({ from: "2025-01-01" })).toEqual(
      fallback,
    );
  });
});
