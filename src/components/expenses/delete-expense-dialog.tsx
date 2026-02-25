"use client";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { deleteExpensesAction } from "@/lib/actions/expenses";

type Props = {
  expenseIds: string[];
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteExpenseDialog({ expenseIds, onClose, onDeleted }: Props) {
  return (
    <DeleteConfirmDialog
      ids={expenseIds}
      entityLabel={{ singular: "expense", plural: "expenses" }}
      deleteAction={deleteExpensesAction}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
}
