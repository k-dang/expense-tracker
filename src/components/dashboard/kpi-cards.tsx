import { Calendar, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { formatCurrencyFromCents } from "@/lib/format";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db/index";
import { getDashboardTotals } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";

type Props = {
  range: DateRange;
};

function daysInRange(range: DateRange): number {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  return Math.max(diff, 1);
}

export async function KpiCards({ range }: Props) {
  const totals = await getDashboardTotals(db, range);
  const days = daysInRange(range);
  const dailyAvgCents = Math.round(totals.totalSpendCents / days);

  const kpis = [
    {
      label: "Total spend",
      value: formatCurrencyFromCents(totals.totalSpendCents),
      icon: DollarSign,
      accentBg: "bg-kpi-accent-1",
      accentText: "text-chart-1",
    },
    {
      label: "Transactions",
      value: String(totals.transactionCount),
      icon: Receipt,
      accentBg: "bg-kpi-accent-2",
      accentText: "text-chart-2",
    },
    {
      label: "Avg per transaction",
      value: formatCurrencyFromCents(totals.averageSpendCents),
      icon: TrendingUp,
      accentBg: "bg-kpi-accent-3",
      accentText: "text-chart-3",
    },
    {
      label: "Daily average",
      value: formatCurrencyFromCents(dailyAvgCents),
      icon: Calendar,
      accentBg: "bg-kpi-accent-4",
      accentText: "text-chart-4",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader className="flex-row items-center gap-3">
            <div className={`rounded-md p-2 ${kpi.accentBg}`}>
              <kpi.icon className={`size-4 ${kpi.accentText}`} />
            </div>
            <div className="min-w-0">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {kpi.value}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}
