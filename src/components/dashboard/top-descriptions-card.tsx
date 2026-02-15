import { Suspense } from "react";
import { getDashboardTopDescriptions } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopDescriptionsChart } from "./top-descriptions-chart";

type Props = {
  range: DateRange;
};

async function TopDescriptionsContent({ range }: Props) {
  const data = await getDashboardTopDescriptions(range);
  return <TopDescriptionsChart data={data} />;
}

function TopDescriptionsFallback() {
  return <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded" />;
}

export function TopDescriptionsCard({ range }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Top descriptions</CardTitle>
      </CardHeader>
      <CardContent className="h-72 min-w-0">
        <Suspense fallback={<TopDescriptionsFallback />}>
          <TopDescriptionsContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
