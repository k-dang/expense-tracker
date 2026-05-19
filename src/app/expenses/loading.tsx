import { ExpensePageContentSkeleton } from "./_components/expense-page-content-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and categorize your expenses
          </p>
        </header>
        <div className="bg-muted h-8 w-18 animate-pulse rounded-md" />
      </div>

      <div className="bg-muted h-40 w-full animate-pulse rounded-lg" />

      <ExpensePageContentSkeleton />
    </main>
  );
}
