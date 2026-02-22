import { Suspense } from "react";
import {
  getDashboardMonthlyTrend,
  getDashboardMonthlyIncomeTrend,
} from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavingsTrendChart } from "./savings-trend-chart";

type Props = {
  range: DateRange;
};

async function SavingsTrendContent({ range }: Props) {
  const [data, incomeData] = await Promise.all([
    getDashboardMonthlyTrend(range),
    getDashboardMonthlyIncomeTrend(range),
  ]);
  return <SavingsTrendChart data={data} incomeData={incomeData} />;
}

function SavingsTrendFallback() {
  return <div className="bg-muted h-80 w-full min-w-0 animate-pulse rounded" />;
}

export function SavingsTrendCard({ range }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Savings by month</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <Suspense fallback={<SavingsTrendFallback />}>
          <SavingsTrendContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
