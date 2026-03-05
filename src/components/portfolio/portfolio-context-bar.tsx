"use client";

import { useState } from "react";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCentsWithCode } from "@/lib/format";
import { PortfolioCurrencyToggle } from "@/components/portfolio/portfolio-currency-toggle";

interface PortfolioContextBarProps {
  portfolioName: string;
  baseCurrency: string;
  snapshotDate: string;
  holdingsCount: number;
  positions: { marketValueCents: number; currency: string }[];
  usdToCadRate: number;
}

function computeConvertedTotalCents(
  positions: { marketValueCents: number; currency: string }[],
  displayCurrency: "CAD" | "USD",
  usdToCadRate: number,
): number {
  return positions.reduce((sum, p) => {
    if (p.currency === displayCurrency) return sum + p.marketValueCents;
    if (p.currency === "USD" && displayCurrency === "CAD") {
      return sum + Math.round(p.marketValueCents * usdToCadRate);
    }
    return sum + Math.round(p.marketValueCents / usdToCadRate);
  }, 0);
}

export function PortfolioContextBar({
  portfolioName,
  baseCurrency,
  snapshotDate,
  holdingsCount,
  positions,
  usdToCadRate,
}: PortfolioContextBarProps) {
  const defaultCurrency = baseCurrency === "USD" ? "USD" : "CAD";
  const [displayCurrency, setDisplayCurrency] = useState<"CAD" | "USD">(defaultCurrency);

  const totalMarketValueCents = computeConvertedTotalCents(
    positions,
    displayCurrency,
    usdToCadRate,
  );

  return (
    <div className="flex items-center gap-x-6 gap-y-3 flex-wrap rounded-xl border border-foreground/[0.06] bg-card/60 backdrop-blur-sm px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-[3px] rounded-full bg-chart-5" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{portfolioName}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Active portfolio
          </span>
        </div>
      </div>

      <div className="hidden sm:block h-6 w-px bg-foreground/10" />

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Total Value
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {formatCurrencyFromCentsWithCode(totalMarketValueCents, displayCurrency)}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Holdings
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {holdingsCount}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          As of
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {formatIsoDateLabel(snapshotDate)}
        </span>
      </div>

      <div className="ml-auto">
        <PortfolioCurrencyToggle
          value={displayCurrency}
          onChange={setDisplayCurrency}
        />
      </div>
    </div>
  );
}
