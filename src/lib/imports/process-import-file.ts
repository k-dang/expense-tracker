import {
  type ParsedCsvRow,
  decodeCsvBytes,
  parseCsvText,
  validateCsvFileInput,
} from "@/lib/imports/csv-utils";
import {
  type ValidatedExpenseInput,
  validateRow,
} from "@/lib/imports/row-validator";
import type { ImportError } from "@/lib/types/api";

export type ProcessImportFileInput = {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
};

export type ProcessImportFileSuccess = {
  status: "succeeded";
  rows: ValidatedExpenseInput[];
  totalRows: number;
};

export type ProcessImportFileFailure = {
  status: "failed";
  errors: ImportError[];
  rowCountTotal?: number;
};

export type ProcessImportFileResult =
  | ProcessImportFileSuccess
  | ProcessImportFileFailure;

function validateCsvRows(rows: ParsedCsvRow[]): ProcessImportFileResult {
  const errors: ImportError[] = [];
  const validatedRows = rows.flatMap((row, index) => {
    const result = validateRow({
      rowNumber: index + 2,
      date: row.date,
      description: row.description,
      amount: row.amount,
      category: row.category,
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

export function processImportFileInput(
  input: ProcessImportFileInput,
): ProcessImportFileResult {
  const fileValidationError = validateCsvFileInput(input);
  if (fileValidationError) {
    return { status: "failed", errors: [fileValidationError] };
  }

  const decoded = decodeCsvBytes(input.bytes);
  if (!decoded.ok) {
    return { status: "failed", errors: [decoded.error] };
  }

  const parsed = parseCsvText(decoded.csvText);
  if ("field" in parsed) {
    return { status: "failed", errors: [parsed] };
  }

  return validateCsvRows(parsed.rows);
}
