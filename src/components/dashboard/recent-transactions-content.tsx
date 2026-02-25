import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge } from "@/components/category-badge";
import { getDashboardRecentTransactions } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCents } from "@/lib/format";

type Props = {
  range: DateRange;
};

export async function RecentTransactionsContent({ range }: Props) {
  const data = await getDashboardRecentTransactions(range);
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No expenses for selected range.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="text-muted-foreground">
                {formatIsoDateLabel(transaction.txnDate)}
              </TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <CategoryBadge category={transaction.category} />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrencyFromCents(transaction.amountCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
