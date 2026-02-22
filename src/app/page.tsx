import { Suspense } from "react";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KpiCards, KpiCardsFallback } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendCard } from "@/components/dashboard/monthly-trend-card";
import { SavingsTrendCard } from "@/components/dashboard/savings-trend-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { TopDescriptionsCard } from "@/components/dashboard/top-descriptions-card";
import { resolveDashboardPageDateRange } from "@/lib/dashboard/date-range";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    trendCategory?: string;
  }>;
};

async function DashboardContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = resolveDashboardPageDateRange(params);

  return (
    <>
      <DateRangeFilter range={range} />
      <Suspense fallback={<KpiCardsFallback />}>
        <KpiCards range={range} />
      </Suspense>
      <MonthlyTrendCard range={range} category={params.trendCategory} />
      <SavingsTrendCard range={range} />
      <CategoryBreakdownCard range={range} />
      <TopDescriptionsCard range={range} />
      <RecentTransactionsCard range={range} />
    </>
  );
}

function DashboardContentFallback() {
  return (
    <>
      <div className="bg-muted h-10 w-48 animate-pulse rounded-md" />
      <KpiCardsFallback />
      <div className="bg-muted h-80 w-full min-w-0 animate-pulse rounded-lg" />
      <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded-lg" />
      <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded-lg" />
      <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded-lg" />
    </>
  );
}

export default function Page({ searchParams }: PageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Expense Dashboard
        </h1>
      </header>

      <Suspense fallback={<DashboardContentFallback />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
