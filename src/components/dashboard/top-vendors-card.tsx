import { Suspense } from "react";
import { getDashboardTopVendors } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopVendorsChart } from "./top-vendors-chart";

type Props = {
  range: DateRange;
};

async function TopVendorsContent({ range }: Props) {
  const data = await getDashboardTopVendors(range);
  return <TopVendorsChart data={data} />;
}

function TopVendorsFallback() {
  return <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded" />;
}

export function TopVendorsCard({ range }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Top vendors</CardTitle>
      </CardHeader>
      <CardContent className="h-72 min-w-0">
        <Suspense fallback={<TopVendorsFallback />}>
          <TopVendorsContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
