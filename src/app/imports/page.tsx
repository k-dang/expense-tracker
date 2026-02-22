import { Suspense } from "react";
import {
  ImportHistoryTable,
  ImportHistoryTableSkeleton,
} from "@/components/imports/import-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Import History
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Import history</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ImportHistoryTableSkeleton />}>
            <ImportHistoryTable />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
