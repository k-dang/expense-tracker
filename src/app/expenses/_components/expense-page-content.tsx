import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { getDistinctCategories, listExpenses } from "@/db/queries/expenses";
import type { SearchParams } from "../_lib/search-params";
import { parsePage, parseSortBy, parseSortOrder } from "../_lib/search-params";

type ExpensePageContentProps = {
  searchParams: Promise<SearchParams>;
};

export async function ExpensePageContent({
  searchParams,
}: ExpensePageContentProps) {
  const params = await searchParams;
  const [categories, data] = await Promise.all([
    getDistinctCategories(),
    listExpenses({
      search: params.search,
      category: params.category,
      sortBy: parseSortBy(params.sortBy),
      sortOrder: parseSortOrder(params.sortOrder),
      page: parsePage(params.page),
    }),
  ]);

  return (
    <>
      <ExpenseFilters
        categories={categories}
        currentSearch={params.search ?? ""}
        currentCategory={params.category ?? ""}
        currentSortBy={params.sortBy ?? "date"}
        currentSortOrder={params.sortOrder ?? "desc"}
      />

      <ExpenseTable
        expenses={data.expenses}
        totalCount={data.totalCount}
        page={data.page}
        pageSize={data.pageSize}
        categories={categories}
      />
    </>
  );
}
