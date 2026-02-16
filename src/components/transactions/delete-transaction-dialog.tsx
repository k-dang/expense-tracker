"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTransactionsAction } from "@/lib/actions/transactions";

type Props = {
  txnIds: string[];
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteTransactionDialog({ txnIds, onClose, onDeleted }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = txnIds.length;

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const result = await deleteTransactionsAction(txnIds);
      if (result.status === "success") {
        onDeleted();
        onClose();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to delete transactions.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count === 1
              ? "Delete transaction?"
              : `Delete ${count} transactions?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
