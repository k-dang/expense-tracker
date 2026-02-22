"use client";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { deleteIncomesAction } from "@/lib/actions/income";

type Props = {
  incomeIds: string[];
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteIncomeDialog({ incomeIds, onClose, onDeleted }: Props) {
  return (
    <DeleteConfirmDialog
      ids={incomeIds}
      entityLabel={{ singular: "income entry", plural: "income entries" }}
      deleteAction={deleteIncomesAction}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
}
