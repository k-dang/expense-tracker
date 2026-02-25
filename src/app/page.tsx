import { Suspense } from "react";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KpiCards, KpiCardsFallback } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendCard } from "@/components/dashboard/monthly-trend-card";
import { SavingsTrendCard } from "@/components/dashboard/savings-trend-card";
import { RecentExpensesCard } from "@/components/dashboard/recent-expenses-card";
import { TopDescriptionsCard } from "@/components/dashboard/top-descriptions-card";
import { resolveDashboardPageDateRange } from "@/lib/dashboard/date-range";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    trendCategory?: string;
  }>;
};

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-muted w-full min-w-0 animate-pulse rounded-lg ${className ?? "h-72"}`}
    />
  );
}

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
      <Suspense fallback={<CardSkeleton className="h-80" />}>
        <MonthlyTrendCard range={range} category={params.trendCategory} />
      </Suspense>
      <SavingsTrendCard range={range} />
      <CategoryBreakdownCard range={range} />
      <TopDescriptionsCard range={range} />
      <RecentExpensesCard range={range} />
    </main>
  );
}
