"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Files,
  ArrowDownToLine,
  Copy,
} from "lucide-react";
import { uploadIncomeImportAction } from "@/lib/actions/income";
import type { ImportPostResult, ImportPostStatus } from "@/lib/types/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusConfig: Record<
  ImportPostStatus,
  {
    icon: typeof CheckCircle2;
    title: string;
    subtitle: (r: ImportPostResult) => string;
    accent: string;
    border: string;
    badgeClass: string;
  }
> = {
  succeeded: {
    icon: CheckCircle2,
    title: "Import succeeded",
    subtitle: (r) =>
      `${r.totalFiles} file${r.totalFiles !== 1 ? "s" : ""} processed — ${r.insertedRows} row${r.insertedRows !== 1 ? "s" : ""} imported`,
    accent: "text-green-400",
    border: "border-l-green-500",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/25 border",
  },
  partial: {
    icon: AlertTriangle,
    title: "Import partially succeeded",
    subtitle: (r) =>
      `${r.succeededFiles} of ${r.totalFiles} file${r.totalFiles !== 1 ? "s" : ""} imported`,
    accent: "text-amber-400",
    border: "border-l-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25 border",
  },
  failed: {
    icon: XCircle,
    title: "Import failed",
    subtitle: (r) =>
      `${r.totalFiles} file${r.totalFiles !== 1 ? "s" : ""} failed to import`,
    accent: "text-red-400",
    border: "border-l-red-500",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/25 border",
  },
};

export function IncomeImportCard() {
  const [state, formAction, isPending] = useActionState(
    uploadIncomeImportAction,
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      state &&
      (state.status === "succeeded" || state.status === "partial") &&
      inputRef.current
    ) {
      inputRef.current.value = "";
    }
  }, [state]);

  const config = state ? statusConfig[state.status] : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
          <CardDescription>
            Upload up to 10 CSV files with exact headers: `date,source,amount`
            with date in MM-DD-YYYY
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={formAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Input
              ref={inputRef}
              type="file"
              name="file"
              accept=".csv,text/csv"
              multiple
              required
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state && config ? (
        <Card className={`border-l-2 ${config.border}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <config.icon className={`size-5 ${config.accent}`} />
              {config.title}
            </CardTitle>
            <CardDescription>{config.subtitle(state)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <Files className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total rows</p>
                  <p className="text-sm font-semibold">{state.totalRows}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <ArrowDownToLine className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Inserted</p>
                  <p className="text-sm font-semibold">{state.insertedRows}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                <Copy className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                  <p className="text-sm font-semibold">{state.duplicateRows}</p>
                </div>
              </div>
            </div>

            {state.files.length > 0 ? (
              <>
                <Separator />
                <div className="space-y-2">
                  {state.files.map((file) => (
                    <div
                      key={`${file.filename}-${file.status}`}
                      className="rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 truncate text-sm font-medium">
                          {file.filename}
                        </span>
                        <Badge
                          className={
                            file.status === "succeeded"
                              ? "bg-green-500/15 text-green-400 border-green-500/25 border"
                              : "bg-red-500/15 text-red-400 border-red-500/25 border"
                          }
                        >
                          {file.status === "succeeded" ? "Succeeded" : "Failed"}
                        </Badge>
                      </div>
                      {file.status === "succeeded" ? (
                        <p className="mt-1 pl-6 text-xs text-muted-foreground">
                          {file.totalRows} rows — {file.insertedRows} inserted,{" "}
                          {file.duplicateRows} duplicates
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-0.5 pl-6">
                          {file.errors.map((error, index) => (
                            <li
                              key={`${file.filename}-${error.field}-${index}`}
                              className="text-xs text-destructive"
                            >
                              Row {error.row} [{error.field}]: {error.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {state.errors.length > 0 ? (
              <>
                <Separator />
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-4 shrink-0 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Validation errors
                    </p>
                  </div>
                  <ul className="mt-1 space-y-0.5 pl-6">
                    {state.errors.map((error, index) => (
                      <li
                        key={`${error.row}-${error.field}-${index}`}
                        className="text-xs text-destructive"
                      >
                        Row {error.row} [{error.field}]: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
