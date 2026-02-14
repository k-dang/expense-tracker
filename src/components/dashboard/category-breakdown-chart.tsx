"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
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
      <CardContent className="min-w-0">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No category data for selected range.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ChartContainer
              className="h-52 w-52 shrink-0 aspect-square"
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
                  innerRadius={48}
                  outerRadius={80}
                  stroke="var(--background)"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul className="w-full min-w-0 space-y-2">
              {chartData.map((item, index) => (
                <li key={item.category} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          BASE_CHART_COLOR_KEYS[
                            index % BASE_CHART_COLOR_KEYS.length
                          ],
                      }}
                    />
                    <span className="flex-1 truncate text-sm">
                      {item.category}
                    </span>
                    <span className="text-muted-foreground w-10 shrink-0 text-right text-xs tabular-nums">
                      {formatPercent(item.percent)}
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
                      {formatCurrencyFromCents(item.totalCents)}
                    </span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.percent * 100).toFixed(1)}%`,
                        backgroundColor:
                          BASE_CHART_COLOR_KEYS[
                            index % BASE_CHART_COLOR_KEYS.length
                          ],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
