import { Suspense } from "react";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { ImportUploadForm } from "@/components/imports/import-upload-form";
import { getDistinctCategories } from "@/db/queries/expenses";
import type { SearchParams } from "./_lib/search-params";
import { ExpensePageContent } from "./_components/expense-page-content";
import { ExpensePageContentSkeleton } from "./_components/expense-page-content-skeleton";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function AddExpenseDialogLoader() {
  const categories = await getDistinctCategories();
  return <AddExpenseDialog categories={categories} />;
}

export default function ExpensesPage({ searchParams }: PageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and categorize your expenses
          </p>
        </header>
        <Suspense
          fallback={
            <div className="bg-muted h-8 w-18 animate-pulse rounded-md" />
          }
        >
          <AddExpenseDialogLoader />
        </Suspense>
      </div>

      <ImportUploadForm />

      <Suspense fallback={<ExpensePageContentSkeleton />}>
        <ExpensePageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
