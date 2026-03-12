import { describe, expect, it } from "vitest";
import { buildPortfolioDisplayModel } from "@/lib/portfolio/portfolio-display";

describe("buildPortfolioDisplayModel", () => {
  it("converts holdings to CAD and recalculates weights", () => {
    const model = buildPortfolioDisplayModel(
      [
        {
          snapshotId: "snapshot-1",
          securityId: "sec-usd",
          symbol: "AAPL",
          companyName: "Apple",
          logoUrl: null,
          exchange: "NASDAQ",
          currency: "USD",
          marketValueCents: 10000,
          weightBps: 5000,
          sortOrder: 0,
          weightPercent: 50,
        },
        {
          snapshotId: "snapshot-1",
          securityId: "sec-cad",
          symbol: "SHOP",
          companyName: "Shopify",
          logoUrl: null,
          exchange: "TSX",
          currency: "CAD",
          marketValueCents: 10000,
          weightBps: 5000,
          sortOrder: 1,
          weightPercent: 50,
        },
      ],
      "CAD",
      1.5,
    );

    expect(model.totalMarketValueCents).toBe(25000);
    expect(model.positions[0]?.symbol).toBe("AAPL");
    expect(model.positions[0]?.marketValueCents).toBe(15000);
    expect(model.positions[0]?.weightBps).toBe(6000);
    expect(model.positions[1]?.weightBps).toBe(4000);
  });

  it("converts holdings to USD and preserves zero totals", () => {
    const model = buildPortfolioDisplayModel(
      [
        {
          snapshotId: "snapshot-2",
          securityId: "sec-cad",
          symbol: "XIU",
          companyName: "XIU ETF",
          logoUrl: null,
          exchange: "TSX",
          currency: "CAD",
          marketValueCents: 0,
          weightBps: 10000,
          sortOrder: 0,
          weightPercent: 100,
        },
      ],
      "USD",
      2,
    );

    expect(model.totalMarketValueCents).toBe(0);
    expect(model.positions[0]?.marketValueCents).toBe(0);
    expect(model.positions[0]?.weightBps).toBe(0);
    expect(model.positions[0]?.weightPercent).toBe(0);
  });
});
