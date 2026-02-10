"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardCategoryBreakdownItem } from "@/db/queries/dashboard";
import { formatCurrencyFromCents, formatPercent } from "@/lib/format";

export type CategoryChartItem = DashboardCategoryBreakdownItem & {
  colorKey: string;
  fill: string;
};

const BASE_CHART_COLOR_KEYS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type Props = {
  data: DashboardCategoryBreakdownItem[];
};

export function toCategoryChartData(data: DashboardCategoryBreakdownItem[]) {
  return data.map((item, index) => {
    const colorKey = `category${index + 1}`;
    return {
      ...item,
      colorKey,
      fill: `var(--color-${colorKey})`,
    };
  });
}

export function getTopCategoryShare(data: DashboardCategoryBreakdownItem[]) {
  return data[0]?.percent ?? null;
}

export function CategoryBreakdownChart({ data }: Props) {
  const chartData = toCategoryChartData(data);
  const topCategoryShare = getTopCategoryShare(data);
  const chartConfig: ChartConfig = {};
  chartData.forEach((item, index) => {
    chartConfig[item.colorKey] = {
      label: item.category,
      color: BASE_CHART_COLOR_KEYS[index % BASE_CHART_COLOR_KEYS.length],
    };
  });

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Category breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-72 min-w-0">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No category data for selected range.
          </p>
        ) : (
          <ChartContainer
            className="h-full w-full min-w-0 aspect-auto"
            config={chartConfig}
          >
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
                      const displayLabel =
                        typeof item.payload?.category === "string"
                          ? item.payload.category
                          : name == null
                            ? "Value"
                            : String(name);

                      return (
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {displayLabel}
                          </span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {formatCurrencyFromCents(numericValue)}
                          </span>
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
                dataKey="totalCents"
                nameKey="colorKey"
                innerRadius={56}
                outerRadius={94}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.category} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={
                  <ChartLegendContent
                    className="w-full flex-wrap justify-start gap-x-3 gap-y-2 [&>div]:min-w-0 [&>div]:max-w-full [&>div]:break-words"
                    nameKey="colorKey"
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        )}
        {topCategoryShare != null ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Top category share: {formatPercent(topCategoryShare)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
