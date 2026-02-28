import { describe, expect, it } from "vitest";
import { mergePortfolioPositions } from "@/lib/portfolio-imports/merge-portfolio-positions";

describe("mergePortfolioPositions", () => {
  it("adds imported values and preserves non-imported symbols", () => {
    const merged = mergePortfolioPositions({
      existingPositions: [
        {
          symbol: "AAPL",
          companyName: "Apple Inc",
          sharesMicros: 1_000_000,
          marketValueCents: 20_000,
          currency: "USD",
        },
        {
          symbol: "MSFT",
          companyName: "Microsoft Corp",
          sharesMicros: 2_000_000,
          marketValueCents: 80_000,
          currency: "USD",
        },
      ],
      importedPositions: [
        {
          symbol: "aapl",
          companyName: "Apple Inc",
          sharesMicros: 500_000,
          marketValueCents: 10_000,
          currency: "USD",
        },
        {
          symbol: "NVDA",
          companyName: "NVIDIA Corp",
          sharesMicros: 250_000,
          marketValueCents: 15_000,
          currency: "USD",
        },
      ],
    });

    expect(merged.map((row) => row.symbol)).toEqual(["MSFT", "AAPL", "NVDA"]);

    const aapl = merged.find((row) => row.symbol === "AAPL");
    expect(aapl?.sharesMicros).toBe(1_500_000);
    expect(aapl?.marketValueCents).toBe(30_000);

    const weights = merged.reduce((sum, row) => sum + row.weightBps, 0);
    expect(weights).toBe(10_000);
  });
});
