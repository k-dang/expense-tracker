import type { IncomeFilters } from "@/db/queries/income";

export type SearchParams = {
  source?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
};

const VALID_SORT_BY = new Set<IncomeFilters["sortBy"]>([
  "date",
  "amount",
  "source",
]);
const VALID_SORT_ORDER = new Set<IncomeFilters["sortOrder"]>(["asc", "desc"]);

export function parseSortBy(v?: string): IncomeFilters["sortBy"] | undefined {
  return VALID_SORT_BY.has(v as IncomeFilters["sortBy"])
    ? (v as IncomeFilters["sortBy"])
    : undefined;
}

export function parseSortOrder(
  v?: string,
): IncomeFilters["sortOrder"] | undefined {
  return VALID_SORT_ORDER.has(v as IncomeFilters["sortOrder"])
    ? (v as IncomeFilters["sortOrder"])
    : undefined;
}

export function parsePage(v?: string): number {
  if (!v) return 1;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}
