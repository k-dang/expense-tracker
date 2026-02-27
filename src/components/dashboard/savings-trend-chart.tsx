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
import { formatCurrency, formatCurrencyWhole } from "@/lib/format";

/* ── colour tokens ─────────────────────────────────────── */
const INCOME_COLOR = "var(--color-emerald-500, #10b981)";
const EXPENSE_COLOR = "var(--color-red-500, #ef4444)";
const SAVINGS_POS_COLOR = "var(--color-blue-500, #3b82f6)";
const SAVINGS_NEG_COLOR = "var(--color-red-500, #ef4444)";
const AVG_LINE_COLOR = "var(--color-zinc-500, #71717a)";
const TARGET_LINE_COLOR = "var(--color-violet-400, #a78bfa)";

/* ── chart configs ─────────────────────────────────────── */
const INCOME_CONFIG = {
  value: { label: "Income", color: INCOME_COLOR },
} satisfies ChartConfig;

const EXPENSE_CONFIG = {
  value: { label: "Expenses", color: EXPENSE_COLOR },
} satisfies ChartConfig;

const SAVINGS_CONFIG = {
  value: { label: "Savings", color: SAVINGS_POS_COLOR },
} satisfies ChartConfig;

/* ── budget targets (dollars) ──────────────────────────── */
const EXPENSE_BUDGET_TARGET = 2000;
const SAVINGS_BUDGET_TARGET = -1 * EXPENSE_BUDGET_TARGET; // savings target = income - expense target; null = no fixed target

/* ── types ─────────────────────────────────────────────── */
type Props = {
  data: DashboardMonthlyTrendItem[];
  incomeData: DashboardMonthlyIncomeTrendItem[];
};

type StatRowProps = {
  label: string;
  value: string;
  variant?: "default" | "muted" | "positive" | "negative";
};

/* ── stat row ──────────────────────────────────────────── */
function StatRow({ label, value, variant = "default" }: StatRowProps) {
  const valueColor =
    variant === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : variant === "negative"
        ? "text-red-600 dark:text-red-400"
        : variant === "muted"
          ? "text-muted-foreground"
          : "text-foreground";

  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground text-xs truncate">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums tracking-tight ${valueColor}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ── stat panel beneath each chart ─────────────────────── */
function ChartStats({
  monthlyAvg,
  monthlyAvgLabel,
  budgetTarget,
  variance,
  accentClass,
}: {
  monthlyAvg: number;
  monthlyAvgLabel: string;
  budgetTarget: number | null;
  variance: number | null;
  accentClass: string;
}) {
  return (
    <div className="mt-4 space-y-1.5">
      <div
        className={`h-px w-full opacity-20 ${accentClass}`}
        style={{ background: "currentColor" }}
      />
      <StatRow
        label={monthlyAvgLabel}
        value={formatCurrencyWhole(monthlyAvg)}
      />
      <StatRow
        label="Monthly budget target"
        value={budgetTarget != null ? formatCurrencyWhole(budgetTarget) : "--"}
        variant="muted"
      />
      {variance != null && (
        <StatRow
          label="Variance to budget"
          value={`${variance >= 0 ? "+" : ""}${formatCurrencyWhole(variance)}`}
          variant={variance >= 0 ? "positive" : "negative"}
        />
      )}
    </div>
  );
}

/* ── reusable single-metric bar chart ──────────────────── */
function MetricBarChart({
  title,
  chartData,
  dataKey,
  config,
  barColor,
  barColorNeg,
  avgValue,
  targetValue,
}: {
  title: string;
  chartData: { month: string; [k: string]: unknown }[];
  dataKey: string;
  config: ChartConfig;
  barColor: string;
  barColorNeg?: string;
  avgValue: number;
  targetValue: number | null;
}) {
  const hasNeg = barColorNeg != null;

  return (
    <div className="min-w-0 flex flex-col">
      <h3 className="text-sm font-semibold tracking-tight mb-2">{title}</h3>

      <ChartContainer
        className="h-52 w-full min-w-0 aspect-auto"
        config={config}
      >
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.4} />
          <XAxis
            dataKey="month"
            tickFormatter={formatShortMonthLabel}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            width={64}
            tickFormatter={(v) => formatCurrencyWhole(Number(v ?? 0))}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate">
                      {title}
                    </span>
                    <span className="text-foreground font-mono font-medium tabular-nums">
                      {formatCurrency(Number(value ?? 0))}
                    </span>
                  </div>
                )}
                indicator="line"
              />
            }
          />
          {/* Average line — solid */}
          <ReferenceLine
            y={avgValue}
            stroke={AVG_LINE_COLOR}
            strokeWidth={1.5}
            strokeDasharray=""
          />
          {/* Budget target — dashed */}
          {targetValue != null && (
            <ReferenceLine
              y={targetValue}
              stroke={TARGET_LINE_COLOR}
              strokeWidth={1.5}
              strokeDasharray="6 3"
            />
          )}

          <Bar dataKey={dataKey} radius={[3, 3, 0, 0]}>
            {chartData.map((entry) => {
              const val = Number(entry[dataKey] ?? 0);
              return (
                <Cell
                  key={entry.month}
                  fill={hasNeg && val < 0 ? barColorNeg : barColor}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/* ── main export ───────────────────────────────────────── */
export function SavingsTrendChart({ data, incomeData }: Props) {
  const chartData = toMonthlyTrendChartData(data, incomeData);

  if (chartData.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No data for selected range.
      </p>
    );
  }

  /* ── compute per-chart data ──────────────────────────── */
  const incomeValues = chartData.map((d) =>
    "incomeDollars" in d ? (d.incomeDollars as number) : 0,
  );
  const expenseValues = chartData.map((d) => d.totalDollars ?? 0);
  const savingsValues = chartData.map((d) =>
    "savingsDollars" in d ? (d.savingsDollars as number) : 0,
  );

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const avgIncome = avg(incomeValues);
  const avgExpenses = avg(expenseValues);
  const avgSavings = avg(savingsValues);

  /* Chart-specific data arrays with a generic "value" key */
  const incomeChartData = chartData.map((d) => ({
    month: d.month,
    value: "incomeDollars" in d ? (d.incomeDollars as number) : 0,
  }));
  const expenseChartData = chartData.map((d) => ({
    month: d.month,
    value: d.totalDollars ?? 0,
  }));
  const savingsChartData = chartData.map((d) => ({
    month: d.month,
    value: "savingsDollars" in d ? (d.savingsDollars as number) : 0,
  }));

  /* Variance: positive = under budget / good */
  const incomeVariance: number | null = null; // no income target
  const expenseVariance = EXPENSE_BUDGET_TARGET - avgExpenses; // under budget = good
  const savingsVariance =
    SAVINGS_BUDGET_TARGET != null ? avgSavings - SAVINGS_BUDGET_TARGET : null;

  return (
    <div className="min-w-0 space-y-6">
      {/* ── 3-chart grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income */}
        <div className="min-w-0">
          <MetricBarChart
            title="Income by month"
            chartData={incomeChartData}
            dataKey="value"
            config={INCOME_CONFIG}
            barColor={INCOME_COLOR}
            avgValue={avgIncome}
            targetValue={null}
          />
          <ChartStats
            monthlyAvg={avgIncome}
            monthlyAvgLabel="Monthly avg income"
            budgetTarget={null}
            variance={incomeVariance}
            accentClass="text-emerald-500"
          />
        </div>

        {/* Expenses */}
        <div className="min-w-0">
          <MetricBarChart
            title="Expenses by month"
            chartData={expenseChartData}
            dataKey="value"
            config={EXPENSE_CONFIG}
            barColor={EXPENSE_COLOR}
            avgValue={avgExpenses}
            targetValue={EXPENSE_BUDGET_TARGET}
          />
          <ChartStats
            monthlyAvg={avgExpenses}
            monthlyAvgLabel="Monthly avg expenses"
            budgetTarget={EXPENSE_BUDGET_TARGET}
            variance={expenseVariance}
            accentClass="text-red-500"
          />
        </div>

        {/* Savings */}
        <div className="min-w-0">
          <MetricBarChart
            title="Savings by month"
            chartData={savingsChartData}
            dataKey="value"
            config={SAVINGS_CONFIG}
            barColor={SAVINGS_POS_COLOR}
            barColorNeg={SAVINGS_NEG_COLOR}
            avgValue={avgSavings}
            targetValue={null}
          />
          <ChartStats
            monthlyAvg={avgSavings}
            monthlyAvgLabel="Monthly avg savings"
            budgetTarget={null}
            variance={savingsVariance}
            accentClass="text-blue-500"
          />
        </div>
      </div>

      {/* ── aggregate breakdown bar ────────────────────── */}
      <AggregateBreakdown chartData={chartData} />
    </div>
  );
}

/* ── aggregate breakdown (kept from before, refined) ───── */
function AggregateBreakdown({
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
  const months = chartData.length;

  const columns = [
    {
      label: "Total income",
      value: formatCurrencyWhole(totalIncome),
      pct: null as string | null,
      dotClass: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total expenses",
      value: formatCurrencyWhole(totalExpenses),
      pct: `${expensesPct.toFixed(1)}%`,
      dotClass: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Total savings",
      value: formatCurrencyWhole(totalSavings),
      pct: `${savingsPct.toFixed(1)}%`,
      dotClass: totalSavings >= 0 ? "bg-blue-500" : "bg-red-500",
      textColor:
        totalSavings >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-3">
      {/* proportion bar */}
      {totalIncome > 0 && (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-red-500/80 transition-all duration-500"
            style={{ width: `${Math.min(expensesPct, 100)}%` }}
          />
          <div
            className={`transition-all duration-500 ${totalSavings >= 0 ? "bg-emerald-500/80" : ""}`}
            style={{
              width: `${Math.max(100 - Math.min(expensesPct, 100), 0)}%`,
            }}
          />
        </div>
      )}

      {/* summary grid */}
      <div className="grid grid-cols-3 gap-3">
        {columns.map((col) => (
          <div
            key={col.label}
            className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block size-2 rounded-full ${col.dotClass}`}
              />
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

      <p className="text-muted-foreground text-[11px] tabular-nums text-right">
        Across {months} month{months !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
