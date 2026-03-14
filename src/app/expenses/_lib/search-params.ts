import type { ExpenseFilters as FiltersType } from "@/db/queries/expenses";

import { parseEnumParam, parsePage } from "@/lib/search-params";

export { parsePage };

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
  return parseEnumParam(v, VALID_SORT_BY);
}

export function parseSortOrder(
  v?: string,
): FiltersType["sortOrder"] | undefined {
  return parseEnumParam(v, VALID_SORT_ORDER);
}
