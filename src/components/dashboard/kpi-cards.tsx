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

export async function KpiCards({ range }: Props) {
  const totals = await getDashboardTotals(db, range);

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Total spend</CardDescription>
          <CardTitle className="text-2xl">
            {formatCurrencyFromCents(totals.totalSpendCents)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Transactions</CardDescription>
          <CardTitle className="text-2xl">
            {String(totals.transactionCount)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Avg per transaction</CardDescription>
          <CardTitle className="text-2xl">
            {formatCurrencyFromCents(totals.averageSpendCents)}
          </CardTitle>
        </CardHeader>
      </Card>
    </section>
  );
}
