import { describe, expect, it } from "vitest";
import {
  getDefaultDashboardDateRange,
  resolveDashboardPageDateRange,
} from "@/lib/dashboard/date-range";

describe("dashboard date range", () => {
  it("builds a 24 month default range ending at the current month", () => {
    expect(
      getDefaultDashboardDateRange(new Date(Date.UTC(2026, 2, 8, 23, 59, 59))),
    ).toEqual({
      from: "2024-04-01",
      to: "2026-03-31",
    });
  });

  it("falls back to the default range when inputs are missing or invalid", () => {
    const expected = getDefaultDashboardDateRange();

    expect(resolveDashboardPageDateRange({ from: "2025-01-01" })).toEqual(
      expected,
    );
    expect(
      resolveDashboardPageDateRange({ from: "bad-date", to: "2025-01-31" }),
    ).toEqual(expected);
    expect(
      resolveDashboardPageDateRange({ from: "2025-02-01", to: "2025-01-31" }),
    ).toEqual(expected);
  });

  it("returns valid custom ranges unchanged", () => {
    expect(
      resolveDashboardPageDateRange({
        from: "2025-01-01",
        to: "2025-12-31",
      }),
    ).toEqual({
      from: "2025-01-01",
      to: "2025-12-31",
    });
  });
});
