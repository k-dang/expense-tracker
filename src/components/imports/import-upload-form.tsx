"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadImportAction } from "@/lib/actions/imports";
import type { ImportPostResult } from "@/lib/types/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ImportPostResult | null = null;

export function ImportUploadForm() {
  const [state, formAction, isPending] = useActionState(
    uploadImportAction,
    initialState,
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

  const resultTitle =
    state?.status === "succeeded"
      ? "Import succeeded"
      : state?.status === "partial"
        ? "Import partially succeeded"
        : "Import failed";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
          <CardDescription>
            Upload up to 10 CSV files with exact headers:
            `date,description,amount,category` with date in MM-DD-YYYY
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

      {state ? (
        <Card>
          <CardHeader>
            <CardTitle>{resultTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-4">
              <p>Total files: {state.totalFiles}</p>
              <p>Succeeded files: {state.succeededFiles}</p>
              <p>Failed files: {state.failedFiles}</p>
              <p>Total rows: {state.totalRows}</p>
              <p>Inserted rows: {state.insertedRows}</p>
              <p>Duplicate rows: {state.duplicateRows}</p>
            </div>

            {state.errors.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {state.errors.map((error, index) => (
                  <li key={`${error.row}-${error.field}-${index}`}>
                    Row {error.row} [{error.field}]: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}

            {state.files.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {state.files.map((file) => (
                  <li key={`${file.filename}-${file.status}`}>
                    <p className="font-medium">
                      {file.filename}:{" "}
                      {file.status === "succeeded" ? "Succeeded" : "Failed"}
                    </p>
                    {file.status === "succeeded" ? (
                      <p>
                        Total rows {file.totalRows}, inserted{" "}
                        {file.insertedRows}, duplicates {file.duplicateRows}
                      </p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-5">
                        {file.errors.map((error, index) => (
                          <li key={`${file.filename}-${error.field}-${index}`}>
                            Row {error.row} [{error.field}]: {error.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
