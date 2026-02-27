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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-muted h-72 w-full min-w-0 animate-pulse rounded"
        />
      ))}
    </div>
  );
}

export function SavingsTrendCard({ range }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Monthly breakdown</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <Suspense fallback={<SavingsTrendFallback />}>
          <SavingsTrendContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
