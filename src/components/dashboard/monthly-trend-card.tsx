import { db } from "@/db/index";
import { getDashboardMonthlyTrend } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { MonthlyTrendChart } from "./monthly-trend-chart";

type Props = {
  range: DateRange;
};

export async function MonthlyTrendCard({ range }: Props) {
  const data = await getDashboardMonthlyTrend(db, range);

  return <MonthlyTrendChart data={data} />;
}
