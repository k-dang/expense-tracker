import Papa from "papaparse";
import type { FileProcessor } from "@/lib/imports/file-processor";
import { decodeCsvBytes, validateCsvFileInput } from "@/lib/imports/csv-utils";
import type {
  ProcessImportFileInput,
  ProcessImportFileResult,
} from "@/lib/imports/process-import-file";
import {
  type ValidatedExpenseInput,
  validateRow,
} from "@/lib/imports/row-validator";
import type { ImportError } from "@/lib/types/api";

const AMEX_REQUIRED_HEADERS = ["date", "description", "amount"];
const AMEX_DATE_PATTERN = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/;

const MONTH_BY_ABBREVIATION: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function convertAmexDateToCanonical(amexDate: string): string | null {
  const match = AMEX_DATE_PATTERN.exec(amexDate);
  if (!match) return null;

  const [, day, monthAbbreviation, year] = match;
  const month = MONTH_BY_ABBREVIATION[monthAbbreviation.toLowerCase()];
  if (!month) return null;

  return `${month}-${day.padStart(2, "0")}-${year}`;
}

function isExpenseRow(raw: Record<string, unknown>): boolean {
  const description = toText(raw.description).toLowerCase();
  if (description.includes("payment received - thank you")) return false;

  const amountStr = toText(raw.amount);
  if (!amountStr || amountStr.startsWith("-")) return false;

  const num = Number.parseFloat(amountStr.replace(/,/g, ""));
  return Number.isFinite(num) && num > 0;
}

function processAmexRows(
  rows: Record<string, unknown>[],
): ProcessImportFileResult {
  const errors: ImportError[] = [];
  const validatedRows: ValidatedExpenseInput[] = [];
  let rowIndex = 1;

  for (const raw of rows) {
    rowIndex += 1;
    if (!isExpenseRow(raw)) continue;

    const date = convertAmexDateToCanonical(toText(raw.date));
    const description = toText(raw.description);
    const amountStr = toText(raw.amount);

    if (!date) {
      errors.push({
        row: rowIndex,
        field: "date",
        message: "Date must be in Amex format, for example 19 Mar 2026.",
      });
      continue;
    }

    const result = validateRow({
      rowNumber: rowIndex,
      date,
      description,
      amount: amountStr,
      category: "",
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

function processAmexCsv(
  input: ProcessImportFileInput,
): ProcessImportFileResult {
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
    const rowNum = typeof err.row === "number" ? (err.row ?? 0) + 2 : 1;
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
    return {
      status: "failed",
      errors: [{ row: 0, field: "file", message: "CSV file is empty." }],
    };
  }

  const headers = parseResult.meta.fields ?? [];
  const headerSet = new Set(headers);
  const missing = AMEX_REQUIRED_HEADERS.filter((h) => !headerSet.has(h));
  if (missing.length > 0) {
    return {
      status: "failed",
      errors: [
        {
          row: 1,
          field: "header",
          message: `Missing required Amex headers: ${missing.join(", ")}.`,
        },
      ],
    };
  }

  return processAmexRows(parseResult.data);
}

export const amexCsvProcessor: FileProcessor = {
  metadata: {
    id: "amex-csv",
    label: "Amex CSV",
    description:
      "American Express CSV export (Date, Description, Amount). Payment rows are skipped.",
    acceptedExtensions: [".csv"],
    acceptedMimeTypes: ["text/csv", "application/vnd.ms-excel"],
  },
  process: processAmexCsv,
};
