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

type Props = {
  ids: string[];
  entityLabel: { singular: string; plural: string };
  deleteAction: (ids: string[]) => Promise<{ status: string; error?: string }>;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteConfirmDialog({
  ids,
  entityLabel,
  deleteAction,
  onClose,
  onDeleted,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = ids.length;
  const label = count === 1 ? entityLabel.singular : entityLabel.plural;

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const result = await deleteAction(ids);
      if (result.status === "success") {
        onDeleted();
        onClose();
      } else {
        setError(result.error ?? "An unknown error occurred.");
      }
    } catch {
      setError(`Failed to delete ${label}.`);
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
              ? `Delete ${entityLabel.singular}?`
              : `Delete ${count} ${entityLabel.plural}?`}
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
