import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { getDistinctCategories } from "@/db/queries/transactions";

export async function AddTransactionDialogLoader() {
  const categories = await getDistinctCategories();
  return <AddTransactionDialog categories={categories} />;
}
