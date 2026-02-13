import type { ImportStatus } from "@/db/schema";

export type ImportErrorField =
  | "date"
  | "vendor"
  | "amount"
  | "category"
  | "file"
  | "header";

export type ImportError = {
  row: number;
  field: ImportErrorField;
  message: string;
};

export type ImportPostResult =
  | {
      status: Extract<ImportStatus, "succeeded">;
      importId: string;
      totalRows: number;
      insertedRows: number;
      duplicateRows: number;
    }
  | {
      status: Extract<ImportStatus, "failed">;
      errors: ImportError[];
    };

export type ImportDeleteResult =
  | {
      status: Extract<ImportStatus, "succeeded">;
      importId: string;
      deletedTransactionCount: number;
    }
  | {
      status: Extract<ImportStatus, "failed">;
      error: string;
    };

export type ImportDuplicatesResult =
  | {
      status: Extract<ImportStatus, "succeeded">;
      importedCount: number;
    }
  | {
      status: Extract<ImportStatus, "failed">;
      error: string;
    };
