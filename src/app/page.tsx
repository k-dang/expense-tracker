import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendCard } from "@/components/dashboard/monthly-trend-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { TopVendorsCard } from "@/components/dashboard/top-vendors-card";
import { resolveDashboardPageDateRange } from "@/lib/dashboard/date-range";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = resolveDashboardPageDateRange(params);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Expense Dashboard
          </h1>
          <p className="text-muted-foreground">
            Single-user CAD expense analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/imports" />}
          >
            Go to imports
          </Button>
        </div>
      </header>

      <DateRangeFilter range={range} />
      <KpiCards range={range} />

      <section className="grid gap-4 lg:grid-cols-2">
        <MonthlyTrendCard range={range} />
        <CategoryBreakdownCard range={range} />
        <TopVendorsCard range={range} />
        <RecentTransactionsCard range={range} />
      </section>
    </main>
  );
}
