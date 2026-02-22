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

function IncomeBreakdown({
  chartData,
}: {
  chartData: ReturnType<typeof toMonthlyTrendChartData>;
}) {
  const totalIncome = chartData.reduce(
    (sum, d) => sum + ("incomeDollars" in d ? (d.incomeDollars as number) : 0),
    0,
  );
  const totalExpenses = chartData.reduce(
    (sum, d) => sum + (d.totalDollars ?? 0),
    0,
  );
  const totalSavings = totalIncome - totalExpenses;

  const expensesPct = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const savingsPct = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const dollarsFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

  const months = chartData.length;

  const columns = [
    {
      label: "Total income",
      value: dollarsFormatter.format(totalIncome),
      pct: null as string | null,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total expenses",
      value: dollarsFormatter.format(totalExpenses),
      pct: `${expensesPct.toFixed(1)}%`,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Total savings",
      value: dollarsFormatter.format(totalSavings),
      pct: `${savingsPct >= 0 ? "" : ""}${savingsPct.toFixed(1)}%`,
      color: totalSavings >= 0 ? "bg-blue-500" : "bg-red-500",
      textColor:
        totalSavings >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="mt-5 space-y-3">
      {/* Stacked proportion bar */}
      {totalIncome > 0 && (
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${Math.min(expensesPct, 100)}%` }}
          />
          <div
            className={`transition-all duration-500 ${totalSavings >= 0 ? "bg-emerald-500" : ""}`}
            style={{
              width: `${Math.max(100 - Math.min(expensesPct, 100), 0)}%`,
            }}
          />
        </div>
      )}

      {/* Breakdown grid */}
      <div className="grid grid-cols-3 gap-3">
        {columns.map((col) => (
          <div
            key={col.label}
            className="bg-muted/50 rounded-lg px-3 py-2.5 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${col.color}`} />
              <span className="text-muted-foreground text-xs tracking-wide">
                {col.label}
              </span>
            </div>
            <p className="font-semibold tabular-nums text-sm tracking-tight">
              {col.value}
            </p>
            {col.pct != null && (
              <p
                className={`text-xs font-medium tabular-nums ${col.textColor}`}
              >
                {col.pct}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  of income
                </span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Period context */}
      <p className="text-muted-foreground text-[11px] tabular-nums text-right">
        Across {months} month{months !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

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
    <div className="min-w-0">
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
            tickFormatter={(value) =>
              dollarsFormatter.format(Number(value ?? 0))
            }
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

      <IncomeBreakdown chartData={chartData} />
    </div>
  );
}
