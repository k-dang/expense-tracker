import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db/index";
import { getDashboardRecentTransactions } from "@/db/queries/dashboard";
import type { DateRange } from "@/lib/dashboard/date-range";
import { formatCurrencyFromCents } from "@/lib/format";

type Props = {
  range: DateRange;
};

export async function RecentTransactionsCard({ range }: Props) {
  const data = await getDashboardRecentTransactions(db, range);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Vendor</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td className="py-2 pr-2">{transaction.txnDate}</td>
                  <td className="py-2 pr-2">{transaction.vendor}</td>
                  <td className="py-2 pr-2">{transaction.category}</td>
                  <td className="py-2 text-right">
                    {formatCurrencyFromCents(transaction.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
