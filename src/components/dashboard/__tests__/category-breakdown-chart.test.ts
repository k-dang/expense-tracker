import { describe, expect, it } from "vitest";
import {
  getTopCategoryShare,
  toCategoryChartData,
} from "@/components/dashboard/category-breakdown-chart";

describe("category breakdown chart transforms", () => {
  it("maps category data into chart items", () => {
    const data = [
      { category: "Food", totalCents: 4800, percent: 0.7058823529 },
      { category: "Rent", totalCents: 2000, percent: 0.2941176471 },
    ];

    expect(toCategoryChartData(data)).toEqual([
      {
        category: "Food",
        totalCents: 4800,
        percent: 0.7058823529,
        colorKey: "category1",
        fill: "var(--color-category1)",
      },
      {
        category: "Rent",
        totalCents: 2000,
        percent: 0.2941176471,
        colorKey: "category2",
        fill: "var(--color-category2)",
      },
    ]);
  });

  it("returns top category share from first item", () => {
    expect(
      getTopCategoryShare([
        { category: "Food", totalCents: 4800, percent: 0.8 },
      ]),
    ).toBe(0.8);
    expect(getTopCategoryShare([])).toBeNull();
  });
});
