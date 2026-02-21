import type { ImportStatus } from "@/db/schema";

export type ImportErrorField =
  | "date"
  | "description"
  | "amount"
  | "category"
  | "source"
  | "file"
  | "header";

export type ImportError = {
  row: number;
  field: ImportErrorField;
  message: string;
};

export type ImportFileResult =
  | {
      filename: string;
      status: Extract<ImportStatus, "succeeded">;
      importId: string;
      totalRows: number;
      insertedRows: number;
      duplicateRows: number;
    }
  | {
      filename: string;
      status: Extract<ImportStatus, "failed">;
      errors: ImportError[];
    };

export type ImportPostStatus = "succeeded" | "partial" | "failed";

export type ImportPostResult = {
  status: ImportPostStatus;
  totalFiles: number;
  succeededFiles: number;
  failedFiles: number;
  totalRows: number;
  insertedRows: number;
  duplicateRows: number;
  files: ImportFileResult[];
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
