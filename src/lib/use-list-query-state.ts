"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";
import {
  applyQueryParamUpdates,
  buildPathWithSearchParams,
  getPageParamUpdate,
  getSortToggleUpdates,
  type QueryParamUpdates,
} from "@/lib/list-query-state";

type UseListQueryStateOptions = {
  currentSortBy: string;
  currentSortOrder: string;
  debounceMs?: number;
};

export function useListQueryState({
  currentSortBy,
  currentSortOrder,
  debounceMs = 300,
}: UseListQueryStateOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const updateParams = useCallback(
    (updates: QueryParamUpdates, options?: { resetPage?: boolean }) => {
      const nextParams = applyQueryParamUpdates(
        searchParams.toString(),
        updates,
        options,
      );

      startTransition(() => {
        router.push(buildPathWithSearchParams(pathname, nextParams));
      });
    },
    [pathname, router, searchParams],
  );

  const toggleSort = useCallback(
    (field: string) => {
      updateParams(
        getSortToggleUpdates(field, currentSortBy, currentSortOrder),
      );
    },
    [currentSortBy, currentSortOrder, updateParams],
  );

  const goToPage = useCallback(
    (page: number) => {
      updateParams(getPageParamUpdate(page), { resetPage: false });
    },
    [updateParams],
  );

  const cancelDebouncedUpdate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const updateParamsDebounced = useCallback(
    (updates: QueryParamUpdates) => {
      cancelDebouncedUpdate();
      debounceRef.current = setTimeout(() => {
        updateParams(updates);
        debounceRef.current = null;
      }, debounceMs);
    },
    [cancelDebouncedUpdate, debounceMs, updateParams],
  );

  useEffect(() => cancelDebouncedUpdate, [cancelDebouncedUpdate]);

  return {
    updateParams,
    updateParamsDebounced,
    cancelDebouncedUpdate,
    toggleSort,
    goToPage,
  };
}
