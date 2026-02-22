import { Suspense } from "react";
import {
  getDashboardMonthlyTrend,
  getDashboardMonthlyIncomeTrend,
  getDashboardCategoryBreakdown,
} from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import {
  getCategoryChartColor,
  getCategoryMonthlyTarget,
} from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrendChart } from "./monthly-trend-chart";
import { MonthlyTrendCategoryFilter } from "./monthly-trend-category-filter";

type Props = {
  range: DateRange;
  category?: string;
};

async function MonthlyTrendContent({
  range,
  category,
}: {
  range: DateRange;
  category?: string;
}) {
  const [data, incomeData] = await Promise.all([
    getDashboardMonthlyTrend(range, category),
    category
      ? Promise.resolve(undefined)
      : getDashboardMonthlyIncomeTrend(range),
  ]);
  const accentColor = category ? getCategoryChartColor(category) : undefined;
  const categoryTarget = category
    ? getCategoryMonthlyTarget(category)
    : undefined;
  return (
    <MonthlyTrendChart
      data={data}
      accentColor={accentColor}
      categoryTarget={categoryTarget}
      incomeData={incomeData}
    />
  );
}

function MonthlyTrendFallback() {
  return <div className="bg-muted h-80 w-full min-w-0 animate-pulse rounded" />;
}

export async function MonthlyTrendCard({ range, category }: Props) {
  const categoryBreakdown = await getDashboardCategoryBreakdown(range);
  const categories = categoryBreakdown.slice(0, 5).map((c) => c.category);

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
