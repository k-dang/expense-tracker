import { IncomePageContentSkeleton } from "./_components/income-page-content-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage your income
          </p>
        </header>
        <div className="bg-muted h-8 w-18 animate-pulse rounded-md" />
      </div>

      <div className="bg-muted h-40 w-full animate-pulse rounded-lg" />

      <IncomePageContentSkeleton />
    </main>
  );
}
