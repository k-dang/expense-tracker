import Image from "next/image";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCents } from "@/lib/format";
import type { PortfolioRow } from "@/db/schema";
import type { LatestPortfolioBreakdown } from "@/db/queries/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioHoldingsPieChart } from "@/components/portfolio/portfolio-holdings-pie-chart";

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
};

function formatWeight(weightBps: number): string {
  return `${(weightBps / 100).toFixed(2)}%`;
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
}: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <CardTitle>Holdings breakdown</CardTitle>
        <p className="text-muted-foreground text-xs">
          {portfolio.name} - As of {formatIsoDateLabel(snapshot.asOfDate)} -
          Total {formatCurrencyFromCents(snapshot.totalMarketValueCents)}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="border-b px-4 py-4 md:border-r md:border-b-0">
            <PortfolioHoldingsPieChart
              positions={positions}
              totalMarketValueCents={snapshot.totalMarketValueCents}
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
                        {formatCurrencyFromCents(position.marketValueCents)}
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
