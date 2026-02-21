import { createHash } from "node:crypto";
import { parseStrictDate } from "@/lib/date/utils";
import type { ImportError } from "@/lib/types/api";

export type ValidatedIncomeInput = {
  incomeDate: string;
  amountCents: number;
  source: string;
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
  incomeDate: string;
  amountCents: number;
  sourceNormalizedLower: string;
  currency?: string;
}): string {
  const currency = input.currency ?? "CAD";
  const base = `income|${input.incomeDate}|${input.amountCents}|${input.sourceNormalizedLower}|${currency}`;
  return createHash("sha256").update(base).digest("hex");
}

export function validateIncomeRow(row: {
  rowNumber: number;
  date: string;
  amount: string;
  source: string;
}): { value: ValidatedIncomeInput } | { error: ImportError } {
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

  const sourceDisplay = normalizeDisplayValue(row.source) || "Other";

  if (sourceDisplay.length > MAX_TEXT_LENGTH) {
    return {
      error: {
        row: row.rowNumber,
        field: "source",
        message: `Source exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`,
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

  const sourceDedup = normalizeForDedup(sourceDisplay);

  return {
    value: {
      incomeDate: parsedDate,
      amountCents,
      source: sourceDisplay,
      fingerprint: buildFingerprint({
        incomeDate: parsedDate,
        amountCents,
        sourceNormalizedLower: sourceDedup,
        currency: "CAD",
      }),
    },
  };
}
