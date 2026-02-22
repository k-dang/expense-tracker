import Papa from "papaparse";
import { decodeCsvBytes, validateCsvFileInput } from "@/lib/imports/csv-utils";
import {
  type ValidatedIncomeInput,
  validateIncomeRow,
} from "@/lib/imports/income-row-validator";
import type { ImportError } from "@/lib/types/api";

type IncomeCanonicalHeader = "date" | "amount" | "source";

type ParsedIncomeRow = Record<IncomeCanonicalHeader, string>;

const REQUIRED_HEADERS: IncomeCanonicalHeader[] = ["date", "source", "amount"];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseIncomeCsvText(
  csvText: string,
): { rows: ParsedIncomeRow[] } | ImportError {
  if (csvText.trim().length === 0) {
    return { row: 0, field: "file", message: "CSV file is empty." };
  }

  const parseResult = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
    transform: (value) => value.trim(),
  });

  if (parseResult.errors.length > 0) {
    const error = parseResult.errors[0];
    const rowNumber =
      typeof error.row === "number"
        ? error.type === "FieldMismatch"
          ? error.row + 2
          : error.row + 1
        : 1;
    return {
      row: rowNumber,
      field: "file",
      message: `CSV parse error [${error.code}]: ${error.message}`,
    };
  }

  if (parseResult.data.length === 0) {
    return { row: 0, field: "file", message: "CSV file is empty." };
  }

  if (
    parseResult.meta.renamedHeaders &&
    Object.keys(parseResult.meta.renamedHeaders).length > 0
  ) {
    return {
      row: 1,
      field: "header",
      message: "Duplicate header detected.",
    };
  }

  const headers = parseResult.meta.fields ?? [];
  const headerSet = new Set(headers);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerSet.has(header),
  );
  if (missingHeaders.length > 0) {
    return {
      row: 1,
      field: "header",
      message: `Missing required headers: ${missingHeaders.join(", ")}.`,
    };
  }

  const extraHeaders = headers.filter(
    (header) => !REQUIRED_HEADERS.includes(header as IncomeCanonicalHeader),
  );
  if (extraHeaders.length > 0) {
    return {
      row: 1,
      field: "header",
      message: `Unexpected headers: ${extraHeaders.join(", ")}.`,
    };
  }

  const rows = parseResult.data.map((row) => ({
    date: toText(row.date),
    amount: toText(row.amount),
    source: toText(row.source),
  }));

  return { rows };
}

export type ProcessIncomeImportFileInput = {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
};

export type ProcessIncomeImportFileSuccess = {
  status: "succeeded";
  rows: ValidatedIncomeInput[];
  totalRows: number;
};

export type ProcessIncomeImportFileFailure = {
  status: "failed";
  errors: ImportError[];
  rowCountTotal?: number;
};

export type ProcessIncomeImportFileResult =
  | ProcessIncomeImportFileSuccess
  | ProcessIncomeImportFileFailure;

function validateIncomeRows(
  rows: ParsedIncomeRow[],
): ProcessIncomeImportFileResult {
  const errors: ImportError[] = [];
  const validatedRows = rows.flatMap((row, index) => {
    const result = validateIncomeRow({
      rowNumber: index + 2,
      date: row.date,
      amount: row.amount,
      source: row.source,
    });

    if ("error" in result) {
      errors.push(result.error);
      return [];
    }

    return [result.value];
  });

  if (errors.length > 0) {
    return { status: "failed", errors, rowCountTotal: rows.length };
  }

  return {
    status: "succeeded",
    rows: validatedRows,
    totalRows: rows.length,
  };
}

export function processIncomeImportFileInput(
  input: ProcessIncomeImportFileInput,
): ProcessIncomeImportFileResult {
  const fileValidationError = validateCsvFileInput(input);
  if (fileValidationError) {
    return { status: "failed", errors: [fileValidationError] };
  }

  const decoded = decodeCsvBytes(input.bytes);
  if (!decoded.ok) {
    return { status: "failed", errors: [decoded.error] };
  }

  const parsed = parseIncomeCsvText(decoded.csvText);
  if ("field" in parsed) {
    return { status: "failed", errors: [parsed] };
  }

  return validateIncomeRows(parsed.rows);
}
