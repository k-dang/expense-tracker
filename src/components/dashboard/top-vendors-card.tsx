import { getDashboardTopVendors } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { TopVendorsChart } from "./top-vendors-chart";

type Props = {
  range: DateRange;
};

export async function TopVendorsCard({ range }: Props) {
  const data = await getDashboardTopVendors(range);
  return <TopVendorsChart data={data} />;
}
