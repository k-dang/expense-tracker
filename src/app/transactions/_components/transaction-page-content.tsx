import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { getDistinctCategories } from "@/db/queries/transactions";
import type { SearchParams } from "../_lib/search-params";
import { parsePage, parseSortBy, parseSortOrder } from "../_lib/search-params";
import { TransactionTableLoader } from "./transaction-table-loader";

type TransactionPageContentProps = {
  searchParams: Promise<SearchParams>;
};

export async function TransactionPageContent({
  searchParams,
}: TransactionPageContentProps) {
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

      <TransactionTableLoader
        search={params.search}
        category={params.category}
        sortBy={parseSortBy(params.sortBy)}
        sortOrder={parseSortOrder(params.sortOrder)}
        page={parsePage(params.page)}
        categories={categories}
      />
    </>
  );
}
