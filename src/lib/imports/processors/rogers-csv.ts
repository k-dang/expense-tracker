import Papa from "papaparse";
import type { FileProcessor } from "@/lib/imports/file-processor";
import {
  decodeCsvBytes,
  validateCsvFileInput,
} from "@/lib/imports/csv-utils";
import {
  type ValidatedExpenseInput,
  validateRow,
} from "@/lib/imports/row-validator";
import type {
  ProcessImportFileInput,
  ProcessImportFileResult,
} from "@/lib/imports/process-import-file";
import type { ImportError } from "@/lib/types/api";

const ROGERS_REQUIRED_HEADERS = ["date", "merchant name", "amount"];
const ROGERS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function convertRogersDateToCanonical(rogersDate: string): string | null {
  if (!ROGERS_DATE_PATTERN.test(rogersDate)) return null;
  const [year, month, day] = rogersDate.split("-");
  return `${month}-${day}-${year}`;
}

function isExpenseRow(amountStr: string): boolean {
  const trimmed = amountStr.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("-")) return false;
  const normalized = (trimmed.startsWith("$") ? trimmed.slice(1) : trimmed)
    .replace(/,/g, "");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) && num > 0;
}

function processRogersRows(
  rows: Record<string, unknown>[],
): ProcessImportFileResult {
  const errors: ImportError[] = [];
  const validatedRows: ValidatedExpenseInput[] = [];
  let rowIndex = 1;

  for (const raw of rows) {
    rowIndex += 1;
    const amountStr = toText(raw.amount);
    if (!isExpenseRow(amountStr)) continue;

    const rogersDate = toText(raw.date);
    const date = convertRogersDateToCanonical(rogersDate);
    const description = toText(raw["merchant name"]);
    const category = toText(raw["merchant category description"]);

    if (!date) {
      errors.push({
        row: rowIndex,
        field: "date",
        message: "Date must be YYYY-MM-DD format.",
      });
      continue;
    }

    const result = validateRow({
      rowNumber: rowIndex,
      date,
      description,
      amount: amountStr,
      category,
    });

    if ("error" in result) {
      errors.push(result.error);
      continue;
    }

    validatedRows.push(result.value);
  }

  if (errors.length > 0) {
    return { status: "failed", errors, rowCountTotal: rows.length };
  }

  return {
    status: "succeeded",
    rows: validatedRows,
    totalRows: validatedRows.length,
  };
}

function processRogersCsv(input: ProcessImportFileInput): ProcessImportFileResult {
  const fileError = validateCsvFileInput(input);
  if (fileError) return { status: "failed", errors: [fileError] };

  const decoded = decodeCsvBytes(input.bytes);
  if (!decoded.ok) return { status: "failed", errors: [decoded.error] };

  const parseResult = Papa.parse<Record<string, unknown>>(decoded.csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
    transform: (value) => (typeof value === "string" ? value.trim() : value),
  });

  if (parseResult.errors.length > 0) {
    const err = parseResult.errors[0];
    const rowNum =
      typeof err.row === "number" ? (err.row ?? 0) + 2 : 1;
    return {
      status: "failed",
      errors: [
        {
          row: rowNum,
          field: "file",
          message: `CSV parse error [${err.code}]: ${err.message}`,
        },
      ],
    };
  }

  if (parseResult.data.length === 0) {
    return { status: "failed", errors: [{ row: 0, field: "file", message: "CSV file is empty." }] };
  }

  const headers = parseResult.meta.fields ?? [];
  const headerSet = new Set(headers);
  const missing = ROGERS_REQUIRED_HEADERS.filter((h) => !headerSet.has(h));
  if (missing.length > 0) {
    return {
      status: "failed",
      errors: [
        {
          row: 1,
          field: "header",
          message: `Missing required Rogers headers: ${missing.join(", ")}.`,
        },
      ],
    };
  }

  return processRogersRows(parseResult.data);
}

export const rogersCsvProcessor: FileProcessor = {
  metadata: {
    id: "rogers-csv",
    label: "Rogers Bank CSV",
    description:
      "Rogers Bank credit card CSV export (Date, Merchant Name, Amount). Non-expense rows (e.g. payments) are skipped.",
    acceptedExtensions: [".csv"],
    acceptedMimeTypes: ["text/csv", "application/vnd.ms-excel"],
  },
  process: processRogersCsv,
};
