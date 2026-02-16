import { Suspense } from "react";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import {
  getDistinctCategories,
  listTransactions,
  type TransactionFilters as FiltersType,
} from "@/db/queries/transactions";
import { Spinner } from "@/components/ui/spinner";

type SearchParams = {
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const VALID_SORT_BY = new Set<FiltersType["sortBy"]>([
  "date",
  "amount",
  "description",
  "category",
]);
const VALID_SORT_ORDER = new Set<FiltersType["sortOrder"]>([
  "asc",
  "desc",
]);

function parseSortBy(v?: string): FiltersType["sortBy"] {
  return VALID_SORT_BY.has(v as FiltersType["sortBy"])
    ? (v as FiltersType["sortBy"])
    : undefined;
}

function parseSortOrder(v?: string): FiltersType["sortOrder"] {
  return VALID_SORT_ORDER.has(v as FiltersType["sortOrder"])
    ? (v as FiltersType["sortOrder"])
    : undefined;
}

type TransactionTableLoaderProps = {
  search?: string;
  category?: string;
  sortBy?: FiltersType["sortBy"];
  sortOrder?: FiltersType["sortOrder"];
  page: number;
  categories: string[];
};

async function TransactionTableLoader({
  search,
  category,
  sortBy,
  sortOrder,
  page,
  categories,
}: TransactionTableLoaderProps) {
  const data = await listTransactions({
    search,
    category,
    sortBy,
    sortOrder,
    page,
  });

  return (
    <TransactionTable
      transactions={data.transactions}
      totalCount={data.totalCount}
      page={data.page}
      pageSize={data.pageSize}
      categories={categories}
    />
  );
}

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

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-8" />
          </div>
        }
      >
        <TransactionPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TransactionPageContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categories = await getDistinctCategories();

  return (
    <>
      <TransactionFilters
        categories={categories}
        currentSearch={params.search ?? ""}
        currentCategory={params.category ?? ""}
        currentSortBy={params.sortBy ?? "date"}
        currentSortOrder={params.sortOrder ?? "desc"}
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-6" />
          </div>
        }
      >
        <TransactionTableLoader
          search={params.search}
          category={params.category}
          sortBy={parseSortBy(params.sortBy)}
          sortOrder={parseSortOrder(params.sortOrder)}
          page={params.page ? Number.parseInt(params.page, 10) : 1}
          categories={categories}
        />
      </Suspense>
    </>
  );
}
