"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import {
  DuplicatePortfolioImportError,
  mergeSnapshotPositionsFromImport,
} from "@/db/queries/portfolio";
import { parseStrictDate } from "@/lib/date/utils";
import { processPortfolioImportFileInput } from "@/lib/portfolio-imports/process-portfolio-import-file";
import type { ImportError } from "@/lib/types/api";

const uploadPortfolioCsvSchema = z.object({
  asOfDate: z.string().trim().min(1, "As-of date is required."),
  file: z.instanceof(File),
});

export type PortfolioCsvUploadResult =
  | {
      status: "succeeded";
      asOfDate: string;
      filename: string;
      importedRows: number;
      mergedSymbols: number;
      totalPortfolioSymbols: number;
    }
  | {
      status: "failed";
      errors: ImportError[];
    }
  | null;

export async function uploadPortfolioCsvAction(
  _previousState: PortfolioCsvUploadResult,
  formData: FormData,
): Promise<PortfolioCsvUploadResult> {
  const rawFile = formData.get("file");
  const rawAsOfDate = formData.get("asOfDate");
  const parsedInput = uploadPortfolioCsvSchema.safeParse({
    file: rawFile,
    asOfDate: typeof rawAsOfDate === "string" ? rawAsOfDate : "",
  });

  if (!parsedInput.success) {
    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message:
            parsedInput.error.issues[0]?.message ??
            "As-of date and file are required.",
        },
      ],
    };
  }

  if (!parseStrictDate(parsedInput.data.asOfDate)) {
    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "asOfDate",
          message: "As-of date must be a valid date in YYYY-MM-DD format.",
        },
      ],
    };
  }

  const bytes = new Uint8Array(await parsedInput.data.file.arrayBuffer());
  const parsedFile = processPortfolioImportFileInput({
    filename: parsedInput.data.file.name,
    contentType: parsedInput.data.file.type,
    bytes,
  });

  if (parsedFile.status === "failed") {
    return {
      status: "failed",
      errors: parsedFile.errors,
    };
  }

  try {
    const merged = await mergeSnapshotPositionsFromImport({
      filename: parsedInput.data.file.name,
      asOfDate: parsedInput.data.asOfDate,
      positions: parsedFile.rows,
      rowCount: parsedFile.totalRows,
    });

    updateTag("portfolio");

    return {
      status: "succeeded",
      asOfDate: parsedInput.data.asOfDate,
      filename: parsedInput.data.file.name,
      importedRows: merged.importedRows,
      mergedSymbols: parsedFile.uniqueSymbols,
      totalPortfolioSymbols: merged.positionCount,
    };
  } catch (error) {
    if (error instanceof DuplicatePortfolioImportError) {
      return {
        status: "failed",
        errors: [
          {
            row: 0,
            field: "file",
            message: error.message,
          },
        ],
      };
    }

    logPortfolioImportFailure({
      filename: parsedInput.data.file.name,
      asOfDate: parsedInput.data.asOfDate,
      totalRows: parsedFile.totalRows,
      uniqueSymbols: parsedFile.uniqueSymbols,
      error,
    });

    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message: "Portfolio import failed. Try again.",
        },
      ],
    };
  }
}

function logPortfolioImportFailure(context: {
  filename: string;
  asOfDate: string;
  totalRows: number;
  uniqueSymbols: number;
  error: unknown;
}): void {
  const errorDetails =
    context.error instanceof Error
      ? {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack,
        }
      : { message: String(context.error) };
  console.error("[portfolio-import] Unexpected failure:", {
    filename: context.filename,
    asOfDate: context.asOfDate,
    totalRows: context.totalRows,
    uniqueSymbols: context.uniqueSymbols,
    ...errorDetails,
  });
}
