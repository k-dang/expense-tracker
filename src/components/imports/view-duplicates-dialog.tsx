"use client";

import { useState, useEffect } from "react";
import { fetchDuplicatesAction } from "@/app/actions/imports";
import type { ImportDuplicateItem } from "@/db/queries/imports";
import { formatCurrencyFromCents } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchDuplicatesAction(importId)
      .then(setDuplicates)
      .finally(() => setLoading(false));
  }, [open, importId]);

  if (duplicateCount === 0) {
    return <span>0</span>;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="link" size="sm" />}>
        {duplicateCount}
      </AlertDialogTrigger>
      <AlertDialogContent size="lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Duplicate rows ({duplicateCount})
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
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((dup) => (
                  <TableRow key={dup.id}>
                    <TableCell>{dup.txnDate}</TableCell>
                    <TableCell>{dup.vendor}</TableCell>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
