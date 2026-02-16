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
import { CategoryBadge } from "@/components/category-badge";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { BulkActionBar } from "@/components/transactions/bulk-action-bar";
import { LearnRuleDialog } from "@/components/transactions/learn-rule-dialog";
import type { TransactionListItem } from "@/db/queries/transactions";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCents } from "@/lib/format";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  transactions: TransactionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: string[];
};

type LearnRuleState = {
  txnId: string;
  description: string;
  oldCategory: string;
  newCategory: string;
} | null;

export function TransactionTable({
  transactions,
  totalCount,
  page,
  pageSize,
  categories,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [learnRule, setLearnRule] = useState<LearnRuleState>(null);

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
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  }, [selectedIds.size, transactions]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCategoryChange = useCallback(
    async (txnId: string, newCategory: string) => {
      const txn = transactions.find((t) => t.id === txnId);
      if (!txn || txn.category === newCategory) {
        setEditingId(null);
        return;
      }

      setEditingId(null);
      setLearnRule({
        txnId,
        description: txn.description,
        oldCategory: txn.category,
        newCategory,
      });
    },
    [transactions]
  );

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
    [router, pathname, searchParams]
  );

  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm">
        <p>No transactions found.</p>
        <p className="text-xs">
          Try adjusting your filters or import some transactions.
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
                    selectedIds.size === transactions.length &&
                    transactions.length > 0
                  }
                  indeterminate={
                    selectedIds.size > 0 &&
                    selectedIds.size < transactions.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-48">Category</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => {
              const isUncategorized = txn.category === "Uncategorized";
              const isSelected = selectedIds.has(txn.id);

              return (
                <TableRow
                  key={txn.id}
                  className={cn(
                    "group",
                    isSelected && "bg-primary/5",
                    isUncategorized && "border-l-2 border-l-amber-500/40"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(txn.id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatIsoDateLabel(txn.txnDate)}
                  </TableCell>
                  <TableCell className="truncate text-sm font-medium">
                    {txn.description}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(txn.id)}
                        className="h-auto p-0 font-normal"
                        aria-hidden={editingId === txn.id}
                      >
                        <CategoryBadge category={txn.category} />
                      </Button>
                      {editingId === txn.id && (
                        <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
                          <CategoryPicker
                            categories={categories}
                            currentCategory={txn.category}
                            onSelect={(cat) =>
                              handleCategoryChange(txn.id, cat)
                            }
                            onClose={() => setEditingId(null)}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatCurrencyFromCents(txn.amountCents)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalCount.toLocaleString()} transaction{totalCount !== 1 ? "s" : ""}
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
          selectedIds={[...selectedIds]}
          categories={categories}
          onClearSelection={clearSelection}
        />
      )}

      {learnRule && (
        <LearnRuleDialog
          txnId={learnRule.txnId}
          description={learnRule.description}
          oldCategory={learnRule.oldCategory}
          newCategory={learnRule.newCategory}
          onCancel={() => setLearnRule(null)}
          onClose={() => setLearnRule(null)}
        />
      )}
    </>
  );
}
