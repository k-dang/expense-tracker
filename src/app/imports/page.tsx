import Link from "next/link";
import { Suspense } from "react";
import { ImportHistoryTable } from "@/components/imports/import-history-table";
import { ImportUploadForm } from "@/components/imports/import-upload-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CSV Imports</h1>
          <p className="text-muted-foreground">
            Upload CSV with exact headers: `date,vendor,amount,category`.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back to dashboard
        </Button>
      </header>

      <ImportUploadForm />
      <Suspense fallback={<ImportHistoryFallback />}>
        <ImportHistoryTable />
      </Suspense>
    </main>
  );
}

function ImportHistoryFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import history</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Loading import history...
      </CardContent>
    </Card>
  );
}
