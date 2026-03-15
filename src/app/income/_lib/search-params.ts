import type { IncomeFilters } from "@/db/queries/income";

import { parseEnumParam, parsePage } from "@/lib/search-params";

export { parsePage };

export type SearchParams = {
  source?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
};

const VALID_SORT_BY = new Set<NonNullable<IncomeFilters["sortBy"]>>([
  "date",
  "amount",
  "source",
]);
const VALID_SORT_ORDER = new Set<NonNullable<IncomeFilters["sortOrder"]>>([
  "asc",
  "desc",
]);

export function parseSortBy(v?: string): IncomeFilters["sortBy"] | undefined {
  return parseEnumParam(v, VALID_SORT_BY);
}

export function parseSortOrder(
  v?: string,
): IncomeFilters["sortOrder"] | undefined {
  return parseEnumParam(v, VALID_SORT_ORDER);
}
