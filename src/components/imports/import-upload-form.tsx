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
    if (state?.status === "succeeded" && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [state]);

  const success = state?.status === "succeeded" ? state : null;

  const failure = state?.status === "failed" ? state : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
          <CardDescription>
            Upload CSV with exact headers: `date,vendor,amount,category` with
            date in MM-DD-YYYY
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
              required
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {success ? (
        <Card>
          <CardHeader>
            <CardTitle>Import succeeded</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            <p>Total rows: {success.totalRows}</p>
            <p>Inserted rows: {success.insertedRows}</p>
            <p>Duplicate rows: {success.duplicateRows}</p>
          </CardContent>
        </Card>
      ) : null}

      {failure ? (
        <Card>
          <CardHeader>
            <CardTitle>Import failed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {failure.errors.map((error, index) => (
                <li key={`${error.row}-${error.field}-${index}`}>
                  Row {error.row} [{error.field}]: {error.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
