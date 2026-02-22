import type { TransactionFilters as FiltersType } from "@/db/queries/transactions";

export { parsePage } from "@/lib/search-params";

export type SearchParams = {
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
};

const VALID_SORT_BY = new Set<FiltersType["sortBy"]>([
  "date",
  "amount",
  "description",
  "category",
]);
const VALID_SORT_ORDER = new Set<FiltersType["sortOrder"]>(["asc", "desc"]);

export function parseSortBy(v?: string): FiltersType["sortBy"] | undefined {
  return VALID_SORT_BY.has(v as FiltersType["sortBy"])
    ? (v as FiltersType["sortBy"])
    : undefined;
}

export function parseSortOrder(
  v?: string,
): FiltersType["sortOrder"] | undefined {
  return VALID_SORT_ORDER.has(v as FiltersType["sortOrder"])
    ? (v as FiltersType["sortOrder"])
    : undefined;
}
