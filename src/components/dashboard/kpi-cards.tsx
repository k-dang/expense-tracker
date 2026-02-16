import { Calendar, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { formatCurrencyFromCents } from "@/lib/format";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardTotals } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";

type Props = {
  range: DateRange;
};

function daysInRange(range: DateRange): number {
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  if (!isValid(from) || !isValid(to)) {
    return 1;
  }

  const diff = differenceInCalendarDays(to, from) + 1;
  return Math.max(diff, 1);
}

export async function KpiCards({ range }: Props) {
  const totals = await getDashboardTotals(range);
  const days = daysInRange(range);
  const dailyAvgCents = Math.round(totals.totalSpendCents / days);

  const kpis = [
    {
      label: "Total spend",
      value: formatCurrencyFromCents(totals.totalSpendCents),
      icon: DollarSign,
      accent: "text-chart-1",
      borderAccent: "border-chart-1",
    },
    {
      label: "Transactions",
      value: String(totals.transactionCount),
      icon: Receipt,
      accent: "text-chart-2",
      borderAccent: "border-chart-2",
    },
    {
      label: "Avg per transaction",
      value: formatCurrencyFromCents(totals.averageSpendCents),
      icon: TrendingUp,
      accent: "text-chart-3",
      borderAccent: "border-chart-3",
    },
    {
      label: "Daily average",
      value: formatCurrencyFromCents(dailyAvgCents),
      icon: Calendar,
      accent: "text-chart-4",
      borderAccent: "border-chart-4",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className={`border-l-2 ${kpi.borderAccent}`}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <kpi.icon className={`size-3.5 ${kpi.accent}`} />
              {kpi.label}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              {kpi.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

export function KpiCardsFallback() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="border-l-2 border-muted">
          <CardHeader>
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}
