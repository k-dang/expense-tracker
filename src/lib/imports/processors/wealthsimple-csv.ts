import Papa from "papaparse";
import type { FileProcessor } from "@/lib/imports/file-processor";
import { decodeCsvBytes, validateCsvFileInput } from "@/lib/imports/csv-utils";
import {
  type ValidatedExpenseInput,
  validateRow,
} from "@/lib/imports/row-validator";
import type {
  ProcessImportFileInput,
  ProcessImportFileResult,
} from "@/lib/imports/process-import-file";
import type { ImportError } from "@/lib/types/api";

const WS_REQUIRED_HEADERS = ["transaction_date", "amount"];
const WS_DESCRIPTION_HEADERS = ["details", "merchant"] as const;
const WS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WS_NON_EXPENSE_TYPES = new Set(["payment"]);
const WS_SUPPORTED_CURRENCY = "CAD";

type WsDescriptionHeader = (typeof WS_DESCRIPTION_HEADERS)[number];

type WsColumnShape = {
  descriptionHeader: WsDescriptionHeader;
  // Newer exports list purchases as negative amounts and payments/refunds as
  // positive; older exports do the opposite.
  expensesAreNegative: boolean;
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function convertWsDateToCanonical(wsDate: string): string | null {
  if (!WS_DATE_PATTERN.test(wsDate)) return null;
  const [year, month, day] = wsDate.split("-");
  return `${month}-${day}-${year}`;
}

function detectColumnShape(headers: string[]): WsColumnShape | null {
  const headerSet = new Set(headers);
  const descriptionHeader = WS_DESCRIPTION_HEADERS.find((header) =>
    headerSet.has(header),
  );
  if (!descriptionHeader) return null;

  return {
    descriptionHeader,
    expensesAreNegative: descriptionHeader === "merchant",
  };
}

function expenseAmountFor(
  raw: Record<string, unknown>,
  shape: WsColumnShape,
): string | null {
  const status = toText(raw.status).toLowerCase();
  if (status && status !== "completed") return null;

  const type = (toText(raw.transaction_type) || toText(raw.type)).toLowerCase();
  if (WS_NON_EXPENSE_TYPES.has(type)) return null;

  const amountStr = toText(raw.amount).replace(/^\$/, "");
  if (!amountStr) return null;

  const isNegative = amountStr.startsWith("-");
  if (isNegative !== shape.expensesAreNegative) return null;

  const magnitude = isNegative ? amountStr.slice(1) : amountStr;
  const num = Number.parseFloat(magnitude.replace(/,/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;

  return magnitude;
}

function processWsRows(
  rows: Record<string, unknown>[],
  shape: WsColumnShape,
): ProcessImportFileResult {
  const errors: ImportError[] = [];
  const validatedRows: ValidatedExpenseInput[] = [];
  let rowIndex = 1;

  for (const raw of rows) {
    rowIndex += 1;
    const amount = expenseAmountFor(raw, shape);
    if (!amount) continue;

    const wsDate = toText(raw.transaction_date);
    const date = convertWsDateToCanonical(wsDate);
    const description = toText(raw[shape.descriptionHeader]);
    const currency = toText(raw.currency).toUpperCase();

    if (!date) {
      errors.push({
        row: rowIndex,
        field: "date",
        message: "Date must be YYYY-MM-DD format.",
      });
      continue;
    }

    if (currency && currency !== WS_SUPPORTED_CURRENCY) {
      errors.push({
        row: rowIndex,
        field: "amount",
        message: `Unsupported currency "${currency}". Only ${WS_SUPPORTED_CURRENCY} transactions can be imported.`,
      });
      continue;
    }

    const result = validateRow({
      rowNumber: rowIndex,
      date,
      description,
      amount,
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

function processWealthsimpleCsv(
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
  const missing = WS_REQUIRED_HEADERS.filter((h) => !headerSet.has(h));
  const shape = detectColumnShape(headers);

  if (missing.length > 0 || !shape) {
    const missingAll = [
      ...missing,
      ...(shape ? [] : [`one of ${WS_DESCRIPTION_HEADERS.join(" or ")}`]),
    ];
    return {
      status: "failed",
      errors: [
        {
          row: 1,
          field: "header",
          message: `Missing required Wealthsimple headers: ${missingAll.join(", ")}.`,
        },
      ],
    };
  }

  return processWsRows(parseResult.data, shape);
}

export const wealthsimpleCsvProcessor: FileProcessor = {
  metadata: {
    id: "wealthsimple-csv",
    label: "Wealthsimple CSV",
    description:
      "Wealthsimple credit card CSV export. Supports both the legacy export (transaction_date, details, amount) and the newer export (transaction_date, transaction_type, status, merchant, amount, currency, category). Payments, refunds, credits, and non-completed rows are skipped.",
    acceptedExtensions: [".csv"],
    acceptedMimeTypes: ["text/csv", "application/vnd.ms-excel"],
  },
  process: processWealthsimpleCsv,
};
