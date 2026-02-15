import { Suspense } from "react";
import { getDashboardMonthlyTrend } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrendChart } from "./monthly-trend-chart";

type Props = {
  range: DateRange;
};

async function MonthlyTrendContent({ range }: Props) {
  const data = await getDashboardMonthlyTrend(range);
  return <MonthlyTrendChart data={data} />;
}

function MonthlyTrendFallback() {
  return <div className="bg-muted h-80 w-full min-w-0 animate-pulse rounded" />;
}

export function MonthlyTrendCard({ range }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Monthly trend</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <Suspense fallback={<MonthlyTrendFallback />}>
          <MonthlyTrendContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
