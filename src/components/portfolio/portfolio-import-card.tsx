"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  XCircle,
} from "lucide-react";
import {
  type PortfolioCsvUploadResult,
  uploadPortfolioCsvAction,
} from "@/lib/actions/portfolio";
import { formatDateLabel, formatIsoDate } from "@/lib/date/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const REQUIRED_COLUMNS = ["symbol", "companyName", "marketValue"];

export function PortfolioImportCard() {
  const [state, formAction, isPending] = useActionState(
    uploadPortfolioCsvAction,
    null as PortfolioCsvUploadResult,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state?.status === "succeeded" && fileInputRef.current) {
      fileInputRef.current.value = "";
      setFileName(null);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import holdings CSV</CardTitle>
        <CardDescription>
          Additively merge holdings into a portfolio date snapshot. Required
          columns (extra columns are ignored):{" "}
          {REQUIRED_COLUMNS.map((col, i) => (
            <span key={col}>
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground/70">
                {col}
              </code>
              {i < REQUIRED_COLUMNS.length - 1 && (
                <span className="text-muted-foreground/40">, </span>
              )}
            </span>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* As-of date */}
            <div className="sm:w-44 space-y-1.5">
              <Label htmlFor="portfolio-as-of-date">As-of date</Label>
              <div>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        id="portfolio-as-of-date"
                        variant="outline"
                        className="h-9 w-full justify-start gap-2 rounded-md px-3 text-left font-normal"
                      />
                    }
                  >
                    <CalendarDays className="size-4 shrink-0" />
                    {formatDateLabel(asOfDate)}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={asOfDate}
                      onSelect={(day) => {
                        if (!day) return;
                        setAsOfDate(day);
                        setIsCalendarOpen(false);
                      }}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <input
                  type="hidden"
                  name="asOfDate"
                  value={formatIsoDate(asOfDate)}
                />
              </div>
            </div>

            {/* CSV file — custom styled trigger over hidden input */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="portfolio-csv-file">CSV file</Label>
              <label
                htmlFor="portfolio-csv-file"
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors",
                  "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  fileName ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{fileName ?? "Choose file…"}</span>
                <input
                  id="portfolio-csv-file"
                  ref={fileInputRef}
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  required
                  className="sr-only"
                  onChange={(e) =>
                    setFileName(e.target.files?.[0]?.name ?? null)
                  }
                />
              </label>
            </div>

            {/* Upload button — aligned to bottom via items-end on parent */}
            <Button type="submit" disabled={isPending} className="h-9 sm:w-28">
              <Upload className="size-4" />
              {isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>

        {state ? <Separator /> : null}

        {state?.status === "succeeded" ? (
          <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm">
            <p className="flex items-center gap-2 font-medium text-green-500">
              <CheckCircle2 className="size-4" />
              Upload merged successfully
              <Badge className="border border-green-500/30 bg-green-500/15 text-green-500">
                Succeeded
              </Badge>
            </p>
            <p className="mt-1 text-muted-foreground">
              {state.filename} on {state.asOfDate}: {state.importedRows} rows,{" "}
              {state.mergedSymbols} imported symbols,{" "}
              {state.totalPortfolioSymbols} symbols in snapshot.
            </p>
          </div>
        ) : null}

        {state?.status === "failed" ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <p className="flex items-center gap-2 font-medium text-destructive">
              <AlertTriangle className="size-4" />
              Upload failed
              <Badge variant="destructive">Failed</Badge>
            </p>
            <ul className="mt-1 space-y-0.5 pl-6">
              {state.errors.map((error, index) => (
                <li
                  key={`${error.row}-${error.field}-${index}`}
                  className="flex items-start gap-1 text-destructive"
                >
                  <XCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Row {error.row} [{error.field}]: {error.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
