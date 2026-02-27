"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LatestPortfolioBreakdown } from "@/db/queries/portfolio";
import { formatCurrencyFromCents, formatPercent } from "@/lib/format";

type Position = LatestPortfolioBreakdown["positions"][number];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

type Props = {
  positions: Position[];
  totalMarketValueCents: number;
};

export function PortfolioHoldingsPieChart({
  positions,
  totalMarketValueCents,
}: Props) {
  const chartData = positions.map((position, index) => {
    const colorKey = `holding${index + 1}`;
    return {
      ...position,
      colorKey,
      fill: `var(--color-${colorKey})`,
      weightPercentValue: position.weightBps / 100,
    };
  });

  const chartConfig: ChartConfig = {};
  chartData.forEach((item, index) => {
    chartConfig[item.colorKey] = {
      label: item.symbol,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <ChartContainer className="h-56 w-56 aspect-square" config={chartConfig}>
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => {
                  const numericValue = Array.isArray(value)
                    ? Number(value[0] ?? 0)
                    : typeof value === "number"
                      ? value
                      : Number(value ?? 0);
                  const label =
                    typeof item.payload?.symbol === "string"
                      ? item.payload.symbol
                      : name == null
                        ? "Holding"
                        : String(name);
                  const percent =
                    typeof item.payload?.weightPercentValue === "number"
                      ? item.payload.weightPercentValue / 100
                      : 0;

                  return (
                    <div className="grid gap-0.5">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="text-muted-foreground truncate">
                          {label}
                        </span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {formatCurrencyFromCents(numericValue)}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-right text-[11px] tabular-nums">
                        {formatPercent(percent)}
                      </div>
                    </div>
                  );
                }}
                nameKey="colorKey"
                indicator="dot"
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="marketValueCents"
            nameKey="colorKey"
            innerRadius={56}
            outerRadius={86}
            stroke="var(--background)"
          >
            {chartData.map((entry) => (
              <Cell key={entry.symbol} fill={entry.fill} />
            ))}
          </Pie>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
          >
            <tspan
              x="50%"
              dy="-0.4em"
              className="fill-muted-foreground text-[11px]"
            >
              Total
            </tspan>
            <tspan
              x="50%"
              dy="1.3em"
              className="text-sm font-semibold tabular-nums"
            >
              {formatCurrencyFromCents(totalMarketValueCents)}
            </tspan>
          </text>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
