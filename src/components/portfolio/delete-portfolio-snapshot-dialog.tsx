"use client";

import { useActionState, useEffect, useState } from "react";
import { deletePortfolioSnapshotAction } from "@/lib/actions/portfolio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  asOfDate: string;
};

export function DeletePortfolioSnapshotDialog({ asOfDate }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deletePortfolioSnapshotAction,
    null,
  );

  const deleteError =
    state?.status === "failed"
      ? typeof state.error === "string"
        ? state.error
        : "Delete failed. Try again."
      : null;

  useEffect(() => {
    if (state?.status === "succeeded") {
      setOpen(false);
    }
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={pending}
        render={<Button variant="destructive" size="sm" />}
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete portfolio snapshot?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the snapshot, all positions, import file records, and
            any orphaned securities for <strong>{asOfDate}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteError ? (
          <p className="px-4 text-sm text-destructive">{deleteError}</p>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="asOfDate" value={asOfDate} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={pending}
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
