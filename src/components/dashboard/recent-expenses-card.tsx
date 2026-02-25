import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentExpensesContent } from "./recent-expenses-content";
import type { DateRange } from "@/lib/dashboard/date-range";

type Props = {
  range: DateRange;
};

function RecentExpensesFallback() {
  return <div className="bg-muted h-72 w-full min-w-0 animate-pulse rounded" />;
}

export function RecentExpensesCard({ range }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<RecentExpensesFallback />}>
          <RecentExpensesContent range={range} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
