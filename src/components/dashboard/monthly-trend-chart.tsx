"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { AreaChartIcon, BarChart3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  DashboardMonthlyTrendItem,
  DashboardMonthlyIncomeTrendItem,
} from "@/db/queries/dashboard";
import { formatMonthLabel, formatShortMonthLabel } from "@/lib/date/utils";
import { formatCurrency } from "@/lib/format";

const MONTHLY_TARGET_DOLLARS = 2000;

const MONTHLY_TREND_CHART_CONFIG = {
  totalDollars: {
    label: "Monthly spend",
    color: "var(--chart-1)",
  },
  incomeDollars: {
    label: "Income",
    color: "var(--color-green-500, #22c55e)",
  },
  savingsDollars: {
    label: "Savings",
    color: "var(--color-blue-500, #3b82f6)",
  },
  target: {
    label: "Target",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ChartView = "area" | "bar";

type Props = {
  data: DashboardMonthlyTrendItem[];
  accentColor?: string;
  categoryTarget?: number;
  incomeData?: DashboardMonthlyIncomeTrendItem[];
};

export type MonthlyTotalsRow = {
  month: string;
  monthLabel: string;
  totalCents: number;
};

export function toMonthlyTrendChartData(
  data: DashboardMonthlyTrendItem[],
  incomeData?: DashboardMonthlyIncomeTrendItem[],
) {
  if (!incomeData || incomeData.length === 0) {
    return data.map((item) => ({
      ...item,
      totalDollars: item.totalCents / 100,
    }));
  }

  const incomeByMonth = new Map(
    incomeData.map((item) => [item.month, item.totalCents]),
  );
  const expenseByMonth = new Map(
    data.map((item) => [item.month, item.totalCents]),
  );
  const allMonths = [
    ...new Set([...expenseByMonth.keys(), ...incomeByMonth.keys()]),
  ].sort();

  return allMonths.map((month) => {
    const expenseCents = expenseByMonth.get(month) ?? 0;
    const incomeCents = incomeByMonth.get(month) ?? 0;
    return {
      month,
      totalCents: expenseCents,
      totalDollars: expenseCents / 100,
      incomeDollars: incomeCents / 100,
      savingsDollars: (incomeCents - expenseCents) / 100,
    };
  });
}

export function toMonthlyTotalsRows(data: DashboardMonthlyTrendItem[]) {
  return data.map((item) => ({
    month: item.month,
    monthLabel: formatMonthLabel(item.month),
    totalCents: item.totalCents,
  }));
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return Number(value[0] ?? 0);
  return Number(value ?? 0);
}

export function MonthlyTrendChart({
  data,
  accentColor,
  categoryTarget,
  incomeData,
}: Props) {
  const [view, setView] = useState<ChartView>("area");
  const chartData = toMonthlyTrendChartData(data, incomeData);
  const showIncome = incomeData && incomeData.length > 0;

  const chartConfig = accentColor
    ? {
        ...MONTHLY_TREND_CHART_CONFIG,
        totalDollars: {
          ...MONTHLY_TREND_CHART_CONFIG.totalDollars,
          color: accentColor,
        },
      }
    : MONTHLY_TREND_CHART_CONFIG;
  const targetDollars = accentColor ? categoryTarget : MONTHLY_TARGET_DOLLARS;
  const showTarget = targetDollars != null;

  function renderChart() {
    if (chartData.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No monthly trend data for selected range.
        </p>
      );
    }

    const gradientColor = accentColor ?? "var(--color-totalDollars)";

    if (view === "area") {
      const AreaOrComposed = showIncome ? ComposedChart : AreaChart;

      return (
        <ChartContainer
          className="h-80 w-full min-w-0 aspect-auto"
          config={chartConfig}
        >
          <AreaOrComposed
            data={chartData}
            margin={{ top: 12, right: 8, bottom: 4 }}
          >
            <defs>
              <linearGradient id="monthlyTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
                <stop
                  offset="100%"
                  stopColor={gradientColor}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => formatCurrency(toNumber(value))}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="text-muted-foreground truncate">
                        {name == null ? "Value" : String(name)}
                      </span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {formatCurrency(toNumber(value))}
                      </span>
                    </div>
                  )}
                  indicator="line"
                />
              }
            />
            {showTarget && (
              <ReferenceLine
                y={targetDollars}
                stroke="var(--chart-2)"
                strokeDasharray="6 4"
                label={{
                  value: formatCurrency(targetDollars),
                  position: "middle",
                  fill: "var(--muted-foreground)",
                }}
              />
            )}
            <Area
              dataKey="totalDollars"
              type="monotone"
              fill="url(#monthlyTrendFill)"
              stroke={accentColor ?? "var(--color-totalDollars)"}
              strokeWidth={2}
            />
            {showIncome && (
              <Line
                dataKey="incomeDollars"
                type="monotone"
                stroke="var(--color-incomeDollars)"
                strokeWidth={2}
                dot={false}
              />
            )}
            {showIncome && (
              <Line
                dataKey="savingsDollars"
                type="monotone"
                stroke="var(--color-savingsDollars)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
              />
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaOrComposed>
        </ChartContainer>
      );
    }

    const BarOrComposed = showIncome ? ComposedChart : BarChart;

    return (
      <ChartContainer
        className="h-80 w-full min-w-0 aspect-auto"
        config={chartConfig}
      >
        <BarOrComposed
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 4 }}
        >
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
            tickFormatter={(value) => formatCurrency(toNumber(value))}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate">
                      {name == null ? "Value" : String(name)}
                    </span>
                    <span className="text-foreground font-mono font-medium tabular-nums">
                      {formatCurrency(toNumber(value))}
                    </span>
                  </div>
                )}
                indicator="line"
              />
            }
          />
          {showTarget && (
            <ReferenceLine
              y={targetDollars}
              stroke="var(--chart-2)"
              strokeDasharray="6 4"
              label={{
                value: formatCurrency(targetDollars),
                position: "right",
                fill: "var(--muted-foreground)",
              }}
            />
          )}
          <Bar
            dataKey="totalDollars"
            fill={accentColor ?? "var(--color-totalDollars)"}
            radius={[4, 4, 0, 0]}
          />
          {showIncome && (
            <Bar
              dataKey="incomeDollars"
              fill="var(--color-incomeDollars)"
              radius={[4, 4, 0, 0]}
            />
          )}
          {showIncome && (
            <Line
              dataKey="savingsDollars"
              type="monotone"
              stroke="var(--color-savingsDollars)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
            />
          )}
          <ChartLegend content={<ChartLegendContent />} />
        </BarOrComposed>
      </ChartContainer>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {chartData.length > 0 && (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant={view === "area" ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Area chart"
            onClick={() => setView("area")}
          >
            <AreaChartIcon />
          </Button>
          <Button
            variant={view === "bar" ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Bar chart"
            onClick={() => setView("bar")}
          >
            <BarChart3Icon />
          </Button>
        </div>
      )}
      {renderChart()}
    </div>
  );
}
