import type { LatestPortfolioBreakdown } from "@/db/queries/portfolio";

export type DisplayCurrency = "CAD" | "USD";

type Position = LatestPortfolioBreakdown["positions"][number];

export type PortfolioDisplayPosition = Omit<
  Position,
  "weightBps" | "weightPercent"
> & {
  weightBps: number;
  weightPercent: number;
};

function convertMarketValueCents(
  marketValueCents: number,
  currency: string,
  displayCurrency: DisplayCurrency,
  usdToCadRate: number,
) {
  if (currency === displayCurrency) {
    return marketValueCents;
  }

  if (currency === "USD" && displayCurrency === "CAD") {
    return Math.round(marketValueCents * usdToCadRate);
  }

  return Math.round(marketValueCents / usdToCadRate);
}

export function buildPortfolioDisplayModel(
  positions: Position[],
  displayCurrency: DisplayCurrency,
  usdToCadRate: number,
) {
  const convertedPositions = positions.map((position) => ({
    ...position,
    marketValueCents: convertMarketValueCents(
      position.marketValueCents,
      position.currency,
      displayCurrency,
      usdToCadRate,
    ),
  }));

  const totalMarketValueCents = convertedPositions.reduce(
    (sum, position) => sum + position.marketValueCents,
    0,
  );

  const weightedPositions: PortfolioDisplayPosition[] = convertedPositions
    .map((position) => ({
      ...position,
      weightBps:
        totalMarketValueCents === 0
          ? 0
          : Math.round(
              (position.marketValueCents / totalMarketValueCents) * 10000,
            ),
      weightPercent:
        totalMarketValueCents === 0
          ? 0
          : (position.marketValueCents / totalMarketValueCents) * 100,
    }))
    .sort((a, b) => b.weightBps - a.weightBps);

  return {
    positions: weightedPositions,
    totalMarketValueCents,
  };
}
