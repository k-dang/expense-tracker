import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db/index";
import { getDashboardRecentTransactions } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { formatCurrencyFromCents } from "@/lib/format";

type Props = {
  range: DateRange;
};

function formatTxnDate(dateStr: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateStr.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw) - 1;
  const day = Number(dayRaw);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return dateStr;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, day)));
}

export async function RecentTransactionsCard({ range }: Props) {
  const data = await getDashboardRecentTransactions(db, range);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No transactions for selected range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">
                      {formatTxnDate(transaction.txnDate)}
                    </TableCell>
                    <TableCell>{transaction.vendor}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrencyFromCents(transaction.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
