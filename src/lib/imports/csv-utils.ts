import Papa from "papaparse";
import type { ImportError } from "@/lib/types/api";

type CanonicalHeader = "date" | "description" | "amount" | "category";

export type ParsedCsvRow = Record<CanonicalHeader, string>;
export type ParsedCsv = { rows: ParsedCsvRow[] };

export const MAX_CSV_FILE_BYTES = 2 * 1024 * 1024;

const REQUIRED_HEADERS: CanonicalHeader[] = ["date", "description", "amount"];
const OPTIONAL_HEADERS: CanonicalHeader[] = ["category"];

const CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
]);

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCsvFileInput(options: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): ImportError | null {
  if (!options.bytes.length) {
    return { row: 0, field: "file", message: "File is empty." };
  }

  if (options.bytes.length > MAX_CSV_FILE_BYTES) {
    return {
      row: 0,
      field: "file",
      message: `File exceeds max size of ${MAX_CSV_FILE_BYTES} bytes.`,
    };
  }

  const lower = options.filename.toLowerCase();
  const hasCsvExt = lower.endsWith(".csv");

  if (!hasCsvExt && !CSV_MIME_TYPES.has(options.contentType)) {
    return {
      row: 0,
      field: "file",
      message: "File must be a CSV.",
    };
  }

  return null;
}

export function decodeCsvBytes(
  bytes: Uint8Array,
): { ok: true; csvText: string } | { ok: false; error: ImportError } {
  const decoder = new TextDecoder("utf-8", { fatal: true });

  try {
    return { ok: true, csvText: decoder.decode(bytes) };
  } catch {
    return {
      ok: false,
      error: {
        row: 0,
        field: "file",
        message: "File must be valid UTF-8 text.",
      },
    };
  }
}

export function parseCsvText(csvText: string): ParsedCsv | ImportError {
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

  const allHeaders = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
  const extraHeaders = headers.filter(
    (header) => !allHeaders.includes(header as CanonicalHeader),
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
    description: toText(row.description),
    amount: toText(row.amount),
    category: toText(row.category),
  }));

  return { rows };
}
