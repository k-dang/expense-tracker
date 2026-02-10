import { describe, expect, it } from "vitest";
import {
  formatMonthLabel,
  toMonthlyTotalsRows,
  toMonthlyTrendChartData,
} from "@/components/dashboard/monthly-trend-chart";

describe("monthly trend chart transforms", () => {
  it("maps monthly trend data for chart and table", () => {
    const data = [
      { month: "2025-01", totalCents: 3000 },
      { month: "2025-02", totalCents: 3800 },
    ];

    expect(toMonthlyTrendChartData(data)).toEqual([
      { month: "2025-01", totalCents: 3000, totalDollars: 30 },
      { month: "2025-02", totalCents: 3800, totalDollars: 38 },
    ]);
    expect(toMonthlyTotalsRows(data)).toEqual([
      { month: "2025-01", monthLabel: "Jan 2025", totalCents: 3000 },
      { month: "2025-02", monthLabel: "Feb 2025", totalCents: 3800 },
    ]);
  });

  it("formats month label with fallback for invalid input", () => {
    expect(formatMonthLabel("2025-06")).toBe("Jun 2025");
    expect(formatMonthLabel("invalid")).toBe("invalid");
  });
});
