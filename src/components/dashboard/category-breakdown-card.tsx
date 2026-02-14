import { getDashboardCategoryBreakdown } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { CategoryBreakdownChart } from "./category-breakdown-chart";

type Props = {
  range: DateRange;
};

export async function CategoryBreakdownCard({ range }: Props) {
  const data = await getDashboardCategoryBreakdown(range);

  return <CategoryBreakdownChart data={data} />;
}
