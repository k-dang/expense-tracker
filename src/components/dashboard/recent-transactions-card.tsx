import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentTransactionsContent } from "./recent-transactions-content";
import type { DateRange } from "@/lib/dashboard/date-range";

type Props = {
  range: DateRange;
};

function RecentTransactionsFallback() {
  return <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded" />;
}

export function RecentTransactionsCard({ range }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<RecentTransactionsFallback />}>
          <RecentTransactionsContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
