import { Suspense } from "react";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { IncomeImportCard } from "@/components/income/income-import-card";
import { getDistinctSources } from "@/db/queries/income";
import type { SearchParams } from "./_lib/search-params";
import { IncomePageContent } from "./_components/income-page-content";
import { IncomePageContentSkeleton } from "./_components/income-page-content-skeleton";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function AddIncomeDialogLoader() {
  const sources = await getDistinctSources();
  return <AddIncomeDialog sources={sources} />;
}

export default function IncomePage({ searchParams }: PageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage your income
          </p>
        </header>
        <Suspense
          fallback={
            <div className="bg-muted h-8 w-18 animate-pulse rounded-md" />
          }
        >
          <AddIncomeDialogLoader />
        </Suspense>
      </div>

      <IncomeImportCard />

      <Suspense fallback={<IncomePageContentSkeleton />}>
        <IncomePageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
