import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getDashboardData } from "@/db/queries/dashboard";
import { importsTable, transactionsTable } from "@/db/schema";
import {
  getDefaultDashboardDateRange,
  validateDateRange,
} from "@/lib/dashboard/date-range";
import { createTestDb } from "@/test/db";

describe("dashboard queries", () => {
  it("returns expected aggregates", async () => {
    const db = createTestDb();
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

    const dashboard = await getDashboardData(db, {
      from: "2025-01-01",
      to: "2025-02-28",
    });

    expect(dashboard.totals.totalSpendCents).toBe(7000);
    expect(dashboard.totals.transactionCount).toBe(3);
    expect(dashboard.monthlyTrend).toHaveLength(2);
    expect(dashboard.categoryBreakdown).toHaveLength(2);
    expect(dashboard.topVendors[0]?.vendor).toBe("Store A");
    expect(dashboard.recentTransactions[0]?.txnDate).toBe("2025-02-01");
  });

  it("validates and derives ranges", () => {
    const err = validateDateRange("2025-03-01", "2025-01-01");
    expect(err).toBeTruthy();

    const range = getDefaultDashboardDateRange(
      new Date("2026-02-07T00:00:00.000Z"),
    );
    expect(range.from).toBe("2025-01-01");
    expect(range.to).toBe("2026-02-28");
  });
});
