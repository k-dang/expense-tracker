import { IncomeFilters } from "@/components/income/income-filters";
import { IncomeTable } from "@/components/income/income-table";
import { getDistinctSources, listIncomes } from "@/db/queries/income";
import type { SearchParams } from "../_lib/search-params";
import { parsePage, parseSortBy, parseSortOrder } from "../_lib/search-params";

type IncomePageContentProps = {
  searchParams: Promise<SearchParams>;
};

export async function IncomePageContent({
  searchParams,
}: IncomePageContentProps) {
  const params = await searchParams;
  const [sources, data] = await Promise.all([
    getDistinctSources(),
    listIncomes({
      source: params.source,
      sortBy: parseSortBy(params.sortBy),
      sortOrder: parseSortOrder(params.sortOrder),
      page: parsePage(params.page),
    }),
  ]);

  return (
    <>
      <IncomeFilters
        sources={sources}
        currentSource={params.source ?? ""}
        currentSortBy={params.sortBy ?? "date"}
        currentSortOrder={params.sortOrder ?? "desc"}
      />

      <IncomeTable
        incomes={data.incomes}
        totalCount={data.totalCount}
        page={data.page}
        pageSize={data.pageSize}
        sources={sources}
      />
    </>
  );
}
