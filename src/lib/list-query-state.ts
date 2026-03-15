export type QueryParamUpdates = Record<string, string | undefined>;

export function applyQueryParamUpdates(
  currentSearchParams: string | URLSearchParams,
  updates: QueryParamUpdates,
  options?: { resetPage?: boolean },
): URLSearchParams {
  const params = new URLSearchParams(currentSearchParams);

  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  if (options?.resetPage ?? true) {
    params.delete("page");
  }

  return params;
}

export function getSortToggleUpdates(
  field: string,
  currentSortBy: string,
  currentSortOrder: string,
): QueryParamUpdates {
  if (currentSortBy === field) {
    return { sortOrder: currentSortOrder === "desc" ? "asc" : "desc" };
  }

  return { sortBy: field, sortOrder: "desc" };
}

export function getPageParamUpdate(page: number): QueryParamUpdates {
  return { page: page > 1 ? String(page) : undefined };
}

export function buildPathWithSearchParams(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
