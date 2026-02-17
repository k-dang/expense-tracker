import { TransactionTable } from "@/components/transactions/transaction-table";
import {
  listTransactions,
  type TransactionFilters as FiltersType,
} from "@/db/queries/transactions";

type TransactionTableLoaderProps = {
  search?: string;
  category?: string;
  sortBy?: FiltersType["sortBy"];
  sortOrder?: FiltersType["sortOrder"];
  page: number;
  categories: string[];
};

export async function TransactionTableLoader({
  search,
  category,
  sortBy,
  sortOrder,
  page,
  categories,
}: TransactionTableLoaderProps) {
  const data = await listTransactions({
    search,
    category,
    sortBy,
    sortOrder,
    page,
  });

  return (
    <TransactionTable
      transactions={data.transactions}
      totalCount={data.totalCount}
      page={data.page}
      pageSize={data.pageSize}
      categories={categories}
    />
  );
}
