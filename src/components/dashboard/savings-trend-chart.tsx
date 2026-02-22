"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  DashboardMonthlyTrendItem,
  DashboardMonthlyIncomeTrendItem,
} from "@/db/queries/dashboard";
import { toMonthlyTrendChartData } from "./monthly-trend-chart";
import { formatShortMonthLabel } from "@/lib/date/utils";

const CHART_CONFIG = {
  savingsDollars: {
    label: "Savings",
    color: "var(--color-green-500, #22c55e)",
  },
} satisfies ChartConfig;

const COLOR_POSITIVE = "var(--color-green-500, #22c55e)";
const COLOR_NEGATIVE = "var(--color-red-500, #ef4444)";

type Props = {
  data: DashboardMonthlyTrendItem[];
  incomeData: DashboardMonthlyIncomeTrendItem[];
};

export function SavingsTrendChart({ data, incomeData }: Props) {
  const chartData = toMonthlyTrendChartData(data, incomeData);
  const dollarsFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });

  if (chartData.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No savings data for selected range.
      </p>
    );
  }

  return (
    <ChartContainer
      className="h-80 w-full min-w-0 aspect-auto"
      config={CHART_CONFIG}
    >
      <BarChart data={chartData} margin={{ top: 12, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatShortMonthLabel}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          width={80}
          tickFormatter={(value) => dollarsFormatter.format(Number(value ?? 0))}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">
                    Savings
                  </span>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {dollarsFormatter.format(Number(value ?? 0))}
                  </span>
                </div>
              )}
              indicator="line"
            />
          }
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Bar dataKey="savingsDollars" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => {
            const savings =
              "savingsDollars" in entry
                ? (entry.savingsDollars as number)
                : 0;
            return (
              <Cell
                key={entry.month}
                fill={savings >= 0 ? COLOR_POSITIVE : COLOR_NEGATIVE}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
