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
import { deleteIncomesAction } from "@/lib/actions/income";

type Props = {
  incomeIds: string[];
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteIncomeDialog({ incomeIds, onClose, onDeleted }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = incomeIds.length;

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const result = await deleteIncomesAction(incomeIds);
      if (result.status === "success") {
        onDeleted();
        onClose();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to delete income entries.");
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
              ? "Delete income entry?"
              : `Delete ${count} income entries?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-destructive text-sm">{error}</p>}

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
