"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCentsWithCode } from "@/lib/format";
import type { PortfolioRow } from "@/db/schema";
import type { LatestPortfolioBreakdown } from "@/db/queries/portfolio";
import type {
  DisplayCurrency,
  PortfolioDisplayPosition,
} from "@/lib/portfolio/portfolio-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioHoldingsPieChart } from "@/components/portfolio/portfolio-holdings-pie-chart";

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
  positions: PortfolioDisplayPosition[];
  totalMarketValueCents: number;
  displayCurrency: DisplayCurrency;
};

function formatWeight(weightBps: number): string {
  return `${(weightBps / 100).toFixed(2)}%`;
}

type StatTileProps = {
  label: string;
  value: string;
  sub: string;
  accentClass: string;
  progressValue?: number;
  layoutClass: string;
};

function StatTile({
  label,
  value,
  sub,
  accentClass,
  progressValue,
  layoutClass,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "group cursor-default px-5 py-4 transition-colors duration-150 hover:bg-muted/40",
        layoutClass,
      )}
    >
      <div className={cn("mb-3 h-[3px] w-6 rounded-full", accentClass)} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold leading-none tabular-nums">
        {value}
      </p>
      {progressValue !== undefined && (
        <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              accentClass,
            )}
            style={{
              width: `${Math.min(100, Math.max(0, progressValue))}%`,
            }}
          />
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
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
  totalMarketValueCents,
  displayCurrency,
}: Props) {
  const n = positions.length;
  const topHolding = positions[0];
  const top5Count = Math.min(5, n);
  const top5WeightBps = positions
    .slice(0, top5Count)
    .reduce((sum, p) => sum + p.weightBps, 0);
  const cadWeightBps = positions
    .filter((p) => p.currency === "CAD")
    .reduce((sum, p) => sum + p.weightBps, 0);

  const statItems: StatTileProps[] = [
    {
      label: "Securities",
      value: String(n),
      sub: n === 1 ? "total holding" : "total holdings",
      accentClass: "bg-chart-1",
      layoutClass: "border-l-0",
    },
    {
      label: "Top Position",
      value: topHolding ? formatWeight(topHolding.weightBps) : "—",
      sub: topHolding?.symbol ?? "—",
      accentClass: "bg-chart-2",
      progressValue: topHolding ? topHolding.weightBps / 100 : undefined,
      layoutClass: "border-l",
    },
    {
      label: "Top 5 Weight",
      value: n > 0 ? `${(top5WeightBps / 100).toFixed(1)}%` : "—",
      sub: `of ${top5Count} position${top5Count !== 1 ? "s" : ""}`,
      accentClass: "bg-chart-3",
      progressValue: n > 0 ? top5WeightBps / 100 : undefined,
      layoutClass: "border-l-0 border-t sm:border-l sm:border-t-0",
    },
    {
      label: "CAD Exposure",
      value: n > 0 ? `${(cadWeightBps / 100).toFixed(1)}%` : "—",
      sub: "native currency",
      accentClass: "bg-chart-4",
      progressValue: n > 0 ? cadWeightBps / 100 : undefined,
      layoutClass: "border-l border-t sm:border-t-0",
    },
  ];

  const fmt = (cents: number) =>
    formatCurrencyFromCentsWithCode(cents, displayCurrency);

  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <CardTitle>Holdings breakdown</CardTitle>
        <p className="text-muted-foreground text-xs">
          {portfolio.name} - As of {formatIsoDateLabel(snapshot.asOfDate)} -
          Total {fmt(totalMarketValueCents)}
        </p>
      </CardHeader>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 border-b bg-muted/20 sm:grid-cols-4">
        {statItems.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </div>

      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="border-b px-4 py-4 md:border-r md:border-b-0">
            <PortfolioHoldingsPieChart
              positions={positions}
              totalMarketValueCents={totalMarketValueCents}
              displayCurrency={displayCurrency}
            />
          </div>

          <ul className="divide-y">
            {positions.map((position, index) => {
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
