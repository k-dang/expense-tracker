import { Suspense } from "react";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendCard } from "@/components/dashboard/monthly-trend-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { TopDescriptionsCard } from "@/components/dashboard/top-descriptions-card";
import { Card, CardHeader } from "@/components/ui/card";
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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Expense Dashboard
        </h1>
      </header>

      <DateRangeFilter range={range} />

      <Suspense fallback={<KpiCardsFallback />}>
        <KpiCards range={range} />
      </Suspense>

      <MonthlyTrendCard range={range} />
      <CategoryBreakdownCard range={range} />
      <TopDescriptionsCard range={range} />
      <RecentTransactionsCard range={range} />
    </main>
  );
}

function KpiCardsFallback() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardHeader className="flex-row items-center gap-3">
            <div className="bg-muted size-8 animate-pulse rounded-md" />
            <div className="min-w-0 space-y-2">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-8 w-32 animate-pulse rounded" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}
