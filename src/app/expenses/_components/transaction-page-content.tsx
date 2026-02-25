import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import {
  getDistinctCategories,
  listTransactions,
} from "@/db/queries/transactions";
import type { SearchParams } from "../_lib/search-params";
import { parsePage, parseSortBy, parseSortOrder } from "../_lib/search-params";

type TransactionPageContentProps = {
  searchParams: Promise<SearchParams>;
};

export async function TransactionPageContent({
  searchParams,
}: TransactionPageContentProps) {
  const params = await searchParams;
  const [categories, data] = await Promise.all([
    getDistinctCategories(),
    listTransactions({
      search: params.search,
      category: params.category,
      sortBy: parseSortBy(params.sortBy),
      sortOrder: parseSortOrder(params.sortOrder),
      page: parsePage(params.page),
    }),
  ]);

  return (
    <>
      <TransactionFilters
        categories={categories}
        currentSearch={params.search ?? ""}
        currentCategory={params.category ?? ""}
        currentSortBy={params.sortBy ?? "date"}
        currentSortOrder={params.sortOrder ?? "desc"}
      />

      <TransactionTable
        transactions={data.transactions}
        totalCount={data.totalCount}
        page={data.page}
        pageSize={data.pageSize}
        categories={categories}
      />
    </>
  );
}
