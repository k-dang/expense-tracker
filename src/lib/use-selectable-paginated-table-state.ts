"use client";

import { useCallback, useMemo, useState } from "react";
import {
  clearSelectedIds,
  getTotalPages,
  removeSelectedIds,
  toggleAllSelectedIds,
  toggleSelectedId,
} from "@/lib/selectable-paginated-table-state";

type UseSelectablePaginatedTableStateOptions = {
  rowIds: readonly string[];
  totalCount: number;
  pageSize: number;
};

export function useSelectablePaginatedTableState({
  rowIds,
  totalCount,
  pageSize,
}: UseSelectablePaginatedTableStateOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalPages = useMemo(
    () => getTotalPages(totalCount, pageSize),
    [pageSize, totalCount],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => toggleSelectedId(prev, id));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => toggleAllSelectedIds(prev, rowIds));
  }, [rowIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(clearSelectedIds());
  }, []);

  const clearDeletedIds = useCallback((ids: readonly string[]) => {
    setSelectedIds((prev) => removeSelectedIds(prev, ids));
  }, []);

  const allRowsSelected = rowIds.length > 0 && selectedIds.size === rowIds.length;
  const someRowsSelected =
    selectedIds.size > 0 && selectedIds.size < rowIds.length;

  return {
    selectedIds,
    totalPages,
    allRowsSelected,
    someRowsSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    clearDeletedIds,
  };
}
