"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardMonthlyTrendItem } from "@/db/queries/dashboard";
import { formatCurrencyFromCents } from "@/lib/format";

const MONTHLY_TREND_CHART_CONFIG = {
  totalDollars: {
    label: "Monthly spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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

export function MonthlyTrendChart({ data }: Props) {
  const chartData = toMonthlyTrendChartData(data);
  const rows = toMonthlyTotalsRows(data);
  const dollarsFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Monthly trend</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No monthly trend data for selected range.
          </p>
        ) : (
          <>
            <ChartContainer
              className="h-72 w-full min-w-0 aspect-auto"
              config={MONTHLY_TREND_CHART_CONFIG}
            >
              <AreaChart data={chartData} margin={{ top: 12, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) =>
                    dollarsFormatter.format(
                      typeof value === "number" ? value : Number(value ?? 0),
                    )
                  }
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
                  fill="var(--color-totalDollars)"
                  fillOpacity={0.2}
                  stroke="var(--color-totalDollars)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell>{item.monthLabel}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrencyFromCents(item.totalCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
