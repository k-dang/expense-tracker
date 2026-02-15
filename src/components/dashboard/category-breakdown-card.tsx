import { Suspense } from "react";
import { getDashboardCategoryBreakdown } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBreakdownChart } from "./category-breakdown-chart";

type Props = {
  range: DateRange;
};

async function CategoryBreakdownContent({ range }: Props) {
  const data = await getDashboardCategoryBreakdown(range);
  return <CategoryBreakdownChart data={data} />;
}

function CategoryBreakdownFallback() {
  return <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded" />;
}

export function CategoryBreakdownCard({ range }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Category breakdown</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <Suspense fallback={<CategoryBreakdownFallback />}>
          <CategoryBreakdownContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
