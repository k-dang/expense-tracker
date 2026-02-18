import { Suspense } from "react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { getDistinctCategories } from "@/db/queries/transactions";
import type { SearchParams } from "./_lib/search-params";
import { TransactionPageContent } from "./_components/transaction-page-content";
import { TransactionPageContentSkeleton } from "./_components/transaction-page-content-skeleton";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function AddTransactionDialogLoader() {
  const categories = await getDistinctCategories();
  return <AddTransactionDialog categories={categories} />;
}

export default function TransactionsPage({ searchParams }: PageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and categorize your transactions
          </p>
        </header>
        <Suspense
          fallback={
            <div className="bg-muted h-8 w-18 animate-pulse rounded-md" />
          }
        >
          <AddTransactionDialogLoader />
        </Suspense>
      </div>

      <Suspense fallback={<TransactionPageContentSkeleton />}>
        <TransactionPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
