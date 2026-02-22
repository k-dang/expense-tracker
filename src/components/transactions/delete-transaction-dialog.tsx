"use client";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { deleteTransactionsAction } from "@/lib/actions/transactions";

type Props = {
  txnIds: string[];
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteTransactionDialog({ txnIds, onClose, onDeleted }: Props) {
  return (
    <DeleteConfirmDialog
      ids={txnIds}
      entityLabel={{ singular: "transaction", plural: "transactions" }}
      deleteAction={deleteTransactionsAction}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
}
