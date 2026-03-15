export function toggleSelectedId(
  selectedIds: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(selectedIds);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  return next;
}

export function toggleAllSelectedIds(
  selectedIds: ReadonlySet<string>,
  rowIds: readonly string[],
): Set<string> {
  if (selectedIds.size === rowIds.length) {
    return new Set();
  }

  return new Set(rowIds);
}

export function clearSelectedIds(): Set<string> {
  return new Set();
}

export function removeSelectedIds(
  selectedIds: ReadonlySet<string>,
  idsToRemove: readonly string[],
): Set<string> {
  const next = new Set(selectedIds);

  for (const id of idsToRemove) {
    next.delete(id);
  }

  return next;
}

export function getTotalPages(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
