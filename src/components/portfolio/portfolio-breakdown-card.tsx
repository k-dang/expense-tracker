"use client";

import { useState } from "react";
import Image from "next/image";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCentsWithCode } from "@/lib/format";
import type { PortfolioRow } from "@/db/schema";
import type { LatestPortfolioBreakdown } from "@/db/queries/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioHoldingsPieChart } from "@/components/portfolio/portfolio-holdings-pie-chart";
import { PortfolioCurrencyToggle } from "@/components/portfolio/portfolio-currency-toggle";

type Position = LatestPortfolioBreakdown["positions"][number];
type Snapshot = NonNullable<LatestPortfolioBreakdown["snapshot"]>;

const HOLDING_COLOR_CLASSES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
] as const;

const HOLDING_TEXT_COLOR_CLASSES = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
] as const;

type Props = {
  portfolio: PortfolioRow;
  snapshot: Snapshot;
  positions: Position[];
  usdToCadRate: number;
};

function formatWeight(weightBps: number): string {
  return `${(weightBps / 100).toFixed(2)}%`;
}

function convertPositions(
  positions: Position[],
  displayCurrency: "CAD" | "USD",
  usdToCadRate: number,
) {
  return positions.map((position) => {
    if (position.currency === displayCurrency) {
      return position;
    }

    let convertedCents: number;
    if (position.currency === "USD" && displayCurrency === "CAD") {
      convertedCents = Math.round(position.marketValueCents * usdToCadRate);
    } else {
      convertedCents = Math.round(position.marketValueCents / usdToCadRate);
    }

    return { ...position, marketValueCents: convertedCents };
  });
}

function SecurityAvatar({
  symbol,
  companyName,
  logoUrl,
}: {
  symbol: string;
  companyName: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return (
      <div className="bg-muted flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border">
        <Image
          src={logoUrl}
          alt={`${companyName} logo`}
          width={32}
          height={32}
          className="size-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function PortfolioBreakdownCard({
  portfolio,
  snapshot,
  positions,
  usdToCadRate,
}: Props) {
  const [displayCurrency, setDisplayCurrency] = useState<"CAD" | "USD">("CAD");

  const convertedPositions = convertPositions(
    positions,
    displayCurrency,
    usdToCadRate,
  );

  const totalMarketValueCents = convertedPositions.reduce(
    (sum, p) => sum + p.marketValueCents,
    0,
  );

  const positionsWithWeights = convertedPositions.map((p) => ({
    ...p,
    weightBps:
      totalMarketValueCents === 0
        ? 0
        : Math.round((p.marketValueCents / totalMarketValueCents) * 10000),
    weightPercent:
      totalMarketValueCents === 0
        ? 0
        : (p.marketValueCents / totalMarketValueCents) * 100,
  }));

  const fmt = (cents: number) =>
    formatCurrencyFromCentsWithCode(cents, displayCurrency);

  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Holdings breakdown</CardTitle>
          <PortfolioCurrencyToggle
            value={displayCurrency}
            onChange={setDisplayCurrency}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {portfolio.name} - As of {formatIsoDateLabel(snapshot.asOfDate)} -
          Total {fmt(totalMarketValueCents)}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="border-b px-4 py-4 md:border-r md:border-b-0">
            <PortfolioHoldingsPieChart
              positions={positionsWithWeights}
              totalMarketValueCents={totalMarketValueCents}
              displayCurrency={displayCurrency}
            />
          </div>

          <ul className="divide-y">
            {positionsWithWeights.map((position, index) => {
              const width = Math.max(
                0,
                Math.min(100, Number(position.weightPercent.toFixed(2))),
              );
              const colorClass =
                HOLDING_COLOR_CLASSES[index % HOLDING_COLOR_CLASSES.length];
              const textColorClass =
                HOLDING_TEXT_COLOR_CLASSES[
                  index % HOLDING_TEXT_COLOR_CLASSES.length
                ];

              return (
                <li
                  key={`${position.snapshotId}-${position.securityId}`}
                  className="px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-3">
                        <SecurityAvatar
                          symbol={position.symbol}
                          companyName={position.companyName}
                          logoUrl={position.logoUrl}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {position.companyName}
                          </p>
                          <p className={`text-xs uppercase ${textColorClass}`}>
                            {position.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full ${colorClass}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatWeight(position.weightBps)}
                      </p>
                      <p className="text-muted-foreground text-xs font-mono tabular-nums">
                        {fmt(position.marketValueCents)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
