"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteImportAction } from "@/lib/actions/imports";
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
  importId: string;
};

export function DeleteImportDialog({ importId }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteImportAction, null);

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
          <AlertDialogTitle>Delete import?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the import history row. If this import succeeded, it
            also removes all transactions created by this import.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteError ? (
          <p className="px-4 text-sm text-destructive">{deleteError}</p>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="importId" value={importId} />
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
