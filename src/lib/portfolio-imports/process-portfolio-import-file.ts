import Papa from "papaparse";
import { decodeCsvBytes, validateCsvFileInput } from "@/lib/imports/csv-utils";
import type { ImportError } from "@/lib/types/api";

const REQUIRED_HEADERS = ["symbol", "companyname", "marketvalue"] as const;

const MAX_TEXT_LENGTH = 150;
const MULTI_SPACE_PATTERN = /\s+/g;
const NUMBER_PATTERN = /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;

export type PortfolioImportPositionInput = {
  symbol: string;
  companyName: string;
  exchange?: string;
  currency?: string;
  logoUrl?: string;
  marketValueCents: number;
};

export type ProcessPortfolioImportFileInput = {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
};

export type ProcessPortfolioImportFileResult =
  | {
      status: "succeeded";
      rows: PortfolioImportPositionInput[];
      totalRows: number;
      uniqueSymbols: number;
    }
  | {
      status: "failed";
      errors: ImportError[];
      rowCountTotal?: number;
    };

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeDisplayValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(MULTI_SPACE_PATTERN, " ");
}

function parseScaledNumber(options: {
  value: string;
  maxDecimals: number;
  scale: number;
}): number | null {
  const trimmed = options.value.trim();
  if (!NUMBER_PATTERN.test(trimmed)) {
    return null;
  }

  const normalized = (
    trimmed.startsWith("$") ? trimmed.slice(1) : trimmed
  ).replace(/,/g, "");

  const [wholePart, decimalPart = ""] = normalized.split(".");
  if (decimalPart.length > options.maxDecimals) {
    return null;
  }

  const whole = Number.parseInt(wholePart, 10);
  const paddedDecimal = decimalPart.padEnd(options.maxDecimals, "0");
  const decimal =
    options.maxDecimals === 0 ? 0 : Number.parseInt(paddedDecimal || "0", 10);

  const scaledWhole = whole * options.scale;
  const divisor = 10 ** options.maxDecimals;
  const scaledDecimal =
    options.maxDecimals === 0
      ? 0
      : Math.round((decimal * options.scale) / divisor);
  const total = scaledWhole + scaledDecimal;

  if (!Number.isSafeInteger(total) || total <= 0) {
    return null;
  }

  return total;
}

function parseRows(csvText: string):
  | {
      ok: true;
      rows: PortfolioImportPositionInput[];
      totalRows: number;
      uniqueSymbols: number;
    }
  | { ok: false; errors: ImportError[]; totalRows?: number } {
  if (csvText.trim().length === 0) {
    return {
      ok: false,
      errors: [{ row: 0, field: "file", message: "CSV file is empty." }],
    };
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
      ok: false,
      errors: [
        {
          row: rowNumber,
          field: "file",
          message: `CSV parse error [${error.code}]: ${error.message}`,
        },
      ],
    };
  }

  if (parseResult.data.length === 0) {
    return {
      ok: false,
      errors: [{ row: 0, field: "file", message: "CSV file is empty." }],
    };
  }

  if (
    parseResult.meta.renamedHeaders &&
    Object.keys(parseResult.meta.renamedHeaders).length > 0
  ) {
    return {
      ok: false,
      errors: [
        { row: 1, field: "header", message: "Duplicate header detected." },
      ],
    };
  }

  const headers = parseResult.meta.fields ?? [];
  const headerSet = new Set(headers);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerSet.has(header),
  );
  if (missingHeaders.length > 0) {
    return {
      ok: false,
      errors: [
        {
          row: 1,
          field: "header",
          message: `Missing required headers: ${missingHeaders.join(", ")}.`,
        },
      ],
    };
  }

  const errors: ImportError[] = [];
  const rowsBySymbol = new Map<string, PortfolioImportPositionInput>();

  parseResult.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const symbol = normalizeDisplayValue(row.symbol).toUpperCase();
    if (!symbol) {
      errors.push({
        row: rowNumber,
        field: "symbol",
        message: "Symbol is required.",
      });
      return;
    }

    const companyName = normalizeDisplayValue(row.companyname);
    if (!companyName) {
      errors.push({
        row: rowNumber,
        field: "companyName",
        message: "Company name is required.",
      });
      return;
    }

    if (companyName.length > MAX_TEXT_LENGTH) {
      errors.push({
        row: rowNumber,
        field: "companyName",
        message: `Company name exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`,
      });
      return;
    }

    const marketValueCents = parseScaledNumber({
      value: normalizeDisplayValue(row.marketvalue),
      maxDecimals: 2,
      scale: 100,
    });
    if (!marketValueCents) {
      errors.push({
        row: rowNumber,
        field: "marketValue",
        message:
          "Market value must be a positive number with optional $/commas and up to 2 decimal places.",
      });
      return;
    }

    const exchangeValue = normalizeDisplayValue(row.exchange);
    const currencyValue = normalizeDisplayValue(row.currency).toUpperCase();
    const logoUrlValue = normalizeDisplayValue(row.logourl);
    const existing = rowsBySymbol.get(symbol);

    if (existing) {
      existing.marketValueCents += marketValueCents;
      existing.companyName = companyName;
      existing.exchange = exchangeValue || existing.exchange;
      existing.currency = currencyValue || existing.currency;
      existing.logoUrl = logoUrlValue || existing.logoUrl;
      return;
    }

    rowsBySymbol.set(symbol, {
      symbol,
      companyName,
      exchange: exchangeValue || undefined,
      currency: currencyValue || undefined,
      logoUrl: logoUrlValue || undefined,
      marketValueCents,
    });
  });

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      totalRows: parseResult.data.length,
    };
  }

  return {
    ok: true,
    rows: [...rowsBySymbol.values()],
    totalRows: parseResult.data.length,
    uniqueSymbols: rowsBySymbol.size,
  };
}

export function processPortfolioImportFileInput(
  input: ProcessPortfolioImportFileInput,
): ProcessPortfolioImportFileResult {
  const fileValidationError = validateCsvFileInput(input);
  if (fileValidationError) {
    return { status: "failed", errors: [fileValidationError] };
  }

  const decoded = decodeCsvBytes(input.bytes);
  if (!decoded.ok) {
    return { status: "failed", errors: [decoded.error] };
  }

  const parsed = parseRows(decoded.csvText);
  if (!parsed.ok) {
    return {
      status: "failed",
      errors: parsed.errors,
      rowCountTotal: parsed.totalRows,
    };
  }

  return {
    status: "succeeded",
    rows: parsed.rows,
    totalRows: parsed.totalRows,
    uniqueSymbols: parsed.uniqueSymbols,
  };
}
