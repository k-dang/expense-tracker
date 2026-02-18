import { Suspense } from "react";
import { getDashboardMonthlyTrend } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { getCategoryChartColor } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrendChart } from "./monthly-trend-chart";
import { MonthlyTrendCategoryFilter } from "./monthly-trend-category-filter";

type Props = {
  range: DateRange;
  category?: string;
  categories: string[];
};

async function MonthlyTrendContent({
  range,
  category,
}: { range: DateRange; category?: string }) {
  const data = await getDashboardMonthlyTrend(range, category);
  const accentColor = category
    ? getCategoryChartColor(category)
    : undefined;
  return <MonthlyTrendChart data={data} accentColor={accentColor} />;
}

function MonthlyTrendFallback() {
  return <div className="bg-muted h-80 w-full min-w-0 animate-pulse rounded" />;
}

export function MonthlyTrendCard({ range, category, categories }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Monthly trend</CardTitle>
      </CardHeader>
      <MonthlyTrendCategoryFilter
        categories={categories}
        currentCategory={category ?? ""}
      />
      <CardContent className="min-w-0">
        <Suspense fallback={<MonthlyTrendFallback />}>
          <MonthlyTrendContent range={range} category={category} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
