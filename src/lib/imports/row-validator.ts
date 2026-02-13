import { createHash } from "node:crypto";
import { parseStrictDate } from "@/lib/date/utils";
import type { ImportError } from "@/lib/types/api";

export type ValidatedTransactionInput = {
  txnDate: string;
  vendor: string;
  amountCents: number;
  category: string;
  vendorDedup: string;
  categoryDedup: string;
  fingerprint: string;
};

const AMOUNT_PATTERN = /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(\.\d{1,2})?$/;
const IMPORT_DATE_PATTERN = /^\d{2}-\d{2}-\d{4}$/;
const MULTI_SPACE_PATTERN = /\s+/g;
const MAX_TEXT_LENGTH = 150;

function parseAmountToCents(value: string): number | null {
  if (!AMOUNT_PATTERN.test(value)) {
    return null;
  }

  const normalized = (value.startsWith("$") ? value.slice(1) : value).replace(
    /,/g,
    "",
  );
  const [wholePart, decimalPart = ""] = normalized.split(".");
  const whole = Number.parseInt(wholePart, 10);
  const centsText = decimalPart.padEnd(2, "0").slice(0, 2);
  const cents = Number.parseInt(centsText, 10);
  const total = whole * 100 + cents;

  if (!Number.isSafeInteger(total) || total <= 0) {
    return null;
  }

  return total;
}

function normalizeDisplayValue(value: string): string {
  return value.trim().replace(MULTI_SPACE_PATTERN, " ");
}

function normalizeForDedup(value: string): string {
  return normalizeDisplayValue(value).toLowerCase();
}

function parseImportDate(value: string): string | null {
  if (!IMPORT_DATE_PATTERN.test(value)) {
    return null;
  }

  const [monthText, dayText, yearText] = value.split("-");
  return parseStrictDate(`${yearText}-${monthText}-${dayText}`);
}

function buildFingerprint(input: {
  txnDate: string;
  vendorNormalizedLower: string;
  amountCents: number;
  categoryNormalizedLower: string;
  currency?: string;
}): string {
  const currency = input.currency ?? "CAD";
  const base = `${input.txnDate}|${input.vendorNormalizedLower}|${input.amountCents}|${input.categoryNormalizedLower}|${currency}`;
  return createHash("sha256").update(base).digest("hex");
}

export function validateRow(row: {
  rowNumber: number;
  date: string;
  vendor: string;
  amount: string;
  category: string;
}): { value: ValidatedTransactionInput } | { error: ImportError } {
  const dateValue = row.date.trim();
  const parsedDate = parseImportDate(dateValue);
  if (!parsedDate) {
    return {
      error: {
        row: row.rowNumber,
        field: "date",
        message: "Date must be a real calendar date in MM-DD-YYYY format.",
      },
    };
  }

  const vendorDisplay = normalizeDisplayValue(row.vendor);
  if (!vendorDisplay) {
    return {
      error: {
        row: row.rowNumber,
        field: "vendor",
        message: "Vendor is required.",
      },
    };
  }

  if (vendorDisplay.length > MAX_TEXT_LENGTH) {
    return {
      error: {
        row: row.rowNumber,
        field: "vendor",
        message: `Vendor exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`,
      },
    };
  }

  const categoryDisplay = normalizeDisplayValue(row.category);
  if (!categoryDisplay) {
    return {
      error: {
        row: row.rowNumber,
        field: "category",
        message: "Category is required.",
      },
    };
  }

  if (categoryDisplay.length > MAX_TEXT_LENGTH) {
    return {
      error: {
        row: row.rowNumber,
        field: "category",
        message: `Category exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`,
      },
    };
  }

  const amountRaw = row.amount.trim();
  const amountCents = parseAmountToCents(amountRaw);
  if (!amountCents) {
    return {
      error: {
        row: row.rowNumber,
        field: "amount",
        message:
          "Amount must be a positive number with optional $/commas and up to 2 decimal places.",
      },
    };
  }

  const vendorDedup = normalizeForDedup(vendorDisplay);
  const categoryDedup = normalizeForDedup(categoryDisplay);

  return {
    value: {
      txnDate: parsedDate,
      vendor: vendorDisplay,
      amountCents,
      category: categoryDisplay,
      vendorDedup,
      categoryDedup,
      fingerprint: buildFingerprint({
        txnDate: parsedDate,
        vendorNormalizedLower: vendorDedup,
        amountCents,
        categoryNormalizedLower: categoryDedup,
        currency: "CAD",
      }),
    },
  };
}
