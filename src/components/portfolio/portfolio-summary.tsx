"use client";

import { useState } from "react";
import type { LatestPortfolioBreakdown } from "@/db/queries/portfolio";
import {
  buildPortfolioDisplayModel,
  type DisplayCurrency,
} from "@/lib/portfolio/portfolio-display";
import { PortfolioBreakdownCard } from "@/components/portfolio/portfolio-breakdown-card";
import { PortfolioContextBar } from "@/components/portfolio/portfolio-context-bar";

type Props = {
  portfolio: LatestPortfolioBreakdown["portfolio"];
  snapshot: NonNullable<LatestPortfolioBreakdown["snapshot"]>;
  positions: LatestPortfolioBreakdown["positions"];
  usdToCadRate: number;
};

export function PortfolioSummary({
  portfolio,
  snapshot,
  positions,
  usdToCadRate,
}: Props) {
  const defaultCurrency: DisplayCurrency =
    portfolio.baseCurrency === "USD" ? "USD" : "CAD";
  const [displayCurrency, setDisplayCurrency] =
    useState<DisplayCurrency>(defaultCurrency);

  const displayModel = buildPortfolioDisplayModel(
    positions,
    displayCurrency,
    usdToCadRate,
  );

  return (
    <>
      <PortfolioContextBar
        portfolioName={portfolio.name}
        snapshotDate={snapshot.asOfDate}
        holdingsCount={displayModel.positions.length}
        totalMarketValueCents={displayModel.totalMarketValueCents}
        displayCurrency={displayCurrency}
        onDisplayCurrencyChange={setDisplayCurrency}
      />
      <PortfolioBreakdownCard
        portfolio={portfolio}
        snapshot={snapshot}
        positions={displayModel.positions}
        totalMarketValueCents={displayModel.totalMarketValueCents}
        displayCurrency={displayCurrency}
      />
    </>
  );
}
