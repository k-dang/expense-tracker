"use client";

import { useState, useEffect } from "react";
import {
  fetchDuplicatesAction,
  importDuplicatesAction,
} from "@/lib/actions/imports";
import type { ImportDuplicateItem } from "@/db/queries/imports";
import { formatCurrencyFromCents } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
  importId: string;
  duplicateCount: number;
};

export function ViewDuplicatesDialog({ importId, duplicateCount }: Props) {
  const [open, setOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<ImportDuplicateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    fetchDuplicatesAction(importId)
      .then(setDuplicates)
      .finally(() => setLoading(false));
  }, [open, importId]);

  if (duplicateCount === 0) {
    return <span>0</span>;
  }

  const allSelected =
    duplicates.length > 0 && selected.size === duplicates.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(duplicates.map((d) => d.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleImportSelected() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const result = await importDuplicatesAction(
        importId,
        Array.from(selected),
      );
      if (result.status === "succeeded") {
        setDuplicates((prev) => prev.filter((d) => !selected.has(d.id)));
        setSelected(new Set());
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="link" size="sm" className="p-0" />}>
        {duplicateCount}
      </AlertDialogTrigger>
      <AlertDialogContent size="xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Duplicate rows ({duplicates.length})
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={
                        selected.size > 0 && selected.size < duplicates.length
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((dup) => (
                  <TableRow key={dup.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(dup.id)}
                        onCheckedChange={() => toggleOne(dup.id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell>{dup.txnDate}</TableCell>
                    <TableCell>{dup.description}</TableCell>
                    <TableCell>
                      {formatCurrencyFromCents(dup.amountCents)}
                    </TableCell>
                    <TableCell>{dup.category}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {dup.reason === "cross_import"
                          ? "Prior import"
                          : "Same file"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleImportSelected}
            disabled={selected.size === 0 || submitting}
          >
            {submitting
              ? "Importing..."
              : `Import Selected${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
