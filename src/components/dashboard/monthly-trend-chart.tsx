"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { AreaChartIcon, BarChart3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardMonthlyTrendItem } from "@/db/queries/dashboard";
import { formatMonthLabel, formatShortMonthLabel } from "@/lib/date/utils";

const MONTHLY_TREND_CHART_CONFIG = {
  totalDollars: {
    label: "Monthly spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type ChartView = "area" | "bar";

type Props = {
  data: DashboardMonthlyTrendItem[];
};

export type MonthlyTotalsRow = {
  month: string;
  monthLabel: string;
  totalCents: number;
};

export function toMonthlyTrendChartData(data: DashboardMonthlyTrendItem[]) {
  return data.map((item) => ({
    ...item,
    totalDollars: item.totalCents / 100,
  }));
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

export function MonthlyTrendChart({ data }: Props) {
  const [view, setView] = useState<ChartView>("area");
  const chartData = toMonthlyTrendChartData(data);
  const dollarsFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });

  function renderChart() {
    if (chartData.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No monthly trend data for selected range.
        </p>
      );
    }

    if (view === "area") {
      return (
        <ChartContainer
          className="h-80 w-full min-w-0 aspect-auto"
          config={MONTHLY_TREND_CHART_CONFIG}
        >
          <AreaChart data={chartData} margin={{ top: 12, right: 8 }}>
            <defs>
              <linearGradient id="monthlyTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-totalDollars)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-totalDollars)"
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
              tickFormatter={(value) =>
                dollarsFormatter.format(toNumber(value))
              }
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
                        {dollarsFormatter.format(toNumber(value))}
                      </span>
                    </div>
                  )}
                  indicator="line"
                />
              }
            />
            <Area
              dataKey="totalDollars"
              type="monotone"
              fill="url(#monthlyTrendFill)"
              stroke="var(--color-totalDollars)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer
        className="h-80 w-full min-w-0 aspect-auto"
        config={MONTHLY_TREND_CHART_CONFIG}
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
            tickFormatter={(value) => dollarsFormatter.format(toNumber(value))}
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
                      {dollarsFormatter.format(toNumber(value))}
                    </span>
                  </div>
                )}
                indicator="line"
              />
            }
          />
          <Bar
            dataKey="totalDollars"
            fill="var(--color-totalDollars)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>Monthly trend</CardTitle>
        {chartData.length > 0 && (
          <div className="flex gap-1">
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
      </CardHeader>
      <CardContent className="min-w-0">{renderChart()}</CardContent>
    </Card>
  );
}
