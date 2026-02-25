import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge } from "@/components/category-badge";
import { getDashboardRecentExpenses } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCents } from "@/lib/format";

type Props = {
  range: DateRange;
};

export async function RecentExpensesContent({ range }: Props) {
  const data = await getDashboardRecentExpenses(range);
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
          {data.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="text-muted-foreground">
                {formatIsoDateLabel(expense.txnDate)}
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>
                <CategoryBadge category={expense.category} />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrencyFromCents(expense.amountCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
