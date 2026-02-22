"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceBadge } from "@/components/income/source-badge";
import { BulkActionBar } from "@/components/income/bulk-action-bar";
import { DeleteIncomeDialog } from "@/components/income/delete-income-dialog";
import { EditIncomeDialog } from "@/components/income/edit-income-dialog";
import type { IncomeListItem } from "@/db/queries/income";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCents } from "@/lib/format";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";

type Props = {
  incomes: IncomeListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  sources: string[];
};

export function IncomeTable({
  incomes,
  totalCount,
  page,
  pageSize,
  sources,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editTarget, setEditTarget] = useState<IncomeListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === incomes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(incomes.map((i) => i.id)));
    }
  }, [selectedIds.size, incomes]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const navigateToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set("page", String(newPage));
      } else {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  if (incomes.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm">
        <p>No income entries found.</p>
        <p className="text-xs">
          Try adjusting your filters, import a CSV, or add an income entry
          manually.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    selectedIds.size === incomes.length && incomes.length > 0
                  }
                  indeterminate={
                    selectedIds.size > 0 && selectedIds.size < incomes.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-48">Source</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.map((income) => {
              const isSelected = selectedIds.has(income.id);

              return (
                <TableRow
                  key={income.id}
                  className={cn("group", isSelected && "bg-primary/5")}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(income.id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatIsoDateLabel(income.incomeDate)}
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={income.source} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatCurrencyFromCents(income.amountCents)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setEditTarget(income)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget([income.id])}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalCount.toLocaleString()} entr{totalCount !== 1 ? "ies" : "y"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => navigateToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground tabular-nums text-xs">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => navigateToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onBulkDelete={() => setDeleteTarget([...selectedIds])}
          onClearSelection={clearSelection}
        />
      )}

      {editTarget && (
        <EditIncomeDialog
          income={editTarget}
          sources={sources}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteIncomeDialog
          incomeIds={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              for (const id of deleteTarget) next.delete(id);
              return next;
            });
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}
