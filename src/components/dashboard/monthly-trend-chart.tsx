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

export type MonthlyTrendChartPoint = DashboardMonthlyTrendItem & {
  totalDollars: number;
};

export type MonthlyTotalsRow = {
  month: string;
  monthLabel: string;
  totalCents: number;
};

export function formatMonthLabel(month: string) {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return month;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

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

function formatShortMonth(month: string) {
  const [, monthRaw] = month.split("-");
  const monthIndex = Number(monthRaw) - 1;
  if (!Number.isFinite(monthIndex)) return month;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, monthIndex, 1)));
}

export function MonthlyTrendChart({ data }: Props) {
  const [view, setView] = useState<ChartView>("area");
  const chartData = toMonthlyTrendChartData(data);
  const dollarsFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });

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
      <CardContent className="min-w-0">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No monthly trend data for selected range.
          </p>
        ) : view === "area" ? (
          <ChartContainer
            className="h-80 w-full min-w-0 aspect-auto"
            config={MONTHLY_TREND_CHART_CONFIG}
          >
            <AreaChart data={chartData} margin={{ top: 12, right: 8 }}>
              <defs>
                <linearGradient
                  id="monthlyTrendFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
                tickFormatter={formatShortMonth}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                width={80}
                tickFormatter={(value) =>
                  dollarsFormatter.format(
                    typeof value === "number" ? value : Number(value ?? 0),
                  )
                }
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const numericValue = Array.isArray(value)
                        ? Number(value[0] ?? 0)
                        : typeof value === "number"
                          ? value
                          : Number(value ?? 0);

                      return (
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {name == null ? "Value" : String(name)}
                          </span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {dollarsFormatter.format(numericValue)}
                          </span>
                        </div>
                      );
                    }}
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
        ) : (
          <ChartContainer
            className="h-80 w-full min-w-0 aspect-auto"
            config={MONTHLY_TREND_CHART_CONFIG}
          >
            <BarChart data={chartData} margin={{ top: 12, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatShortMonth}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                width={80}
                tickFormatter={(value) =>
                  dollarsFormatter.format(
                    typeof value === "number" ? value : Number(value ?? 0),
                  )
                }
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const numericValue = Array.isArray(value)
                        ? Number(value[0] ?? 0)
                        : typeof value === "number"
                          ? value
                          : Number(value ?? 0);

                      return (
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {name == null ? "Value" : String(name)}
                          </span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {dollarsFormatter.format(numericValue)}
                          </span>
                        </div>
                      );
                    }}
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
        )}
      </CardContent>
    </Card>
  );
}
