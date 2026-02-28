"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import {
  DuplicatePortfolioImportError,
  mergeSnapshotPositionsFromImport,
  upsertSnapshotWithPositions,
} from "@/db/queries/portfolio";
import { formatIsoDate, parseStrictDate } from "@/lib/date/utils";
import { processPortfolioImportFileInput } from "@/lib/portfolio-imports/process-portfolio-import-file";
import type { ImportError } from "@/lib/types/api";

const DEMO_POSITIONS = [
  {
    symbol: "GOOGL",
    companyName: "Alphabet Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/google.com",
    sharesMicros: 165_700_000,
    marketValueCents: 2_850_000,
    weightBps: 1425,
  },
  {
    symbol: "MA",
    companyName: "Mastercard Incorporated",
    exchange: "NYSE",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/mastercard.com",
    sharesMicros: 57_060_000,
    marketValueCents: 2_682_000,
    weightBps: 1341,
  },
  {
    symbol: "META",
    companyName: "Meta Platforms, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/meta.com",
    sharesMicros: 42_280_000,
    marketValueCents: 2_114_000,
    weightBps: 1057,
  },
  {
    symbol: "AMZN",
    companyName: "Amazon.com, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/amazon.com",
    sharesMicros: 108_840_000,
    marketValueCents: 2_068_000,
    weightBps: 1034,
  },
  {
    symbol: "ASML",
    companyName: "ASML Holding N.V.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/asml.com",
    sharesMicros: 20_560_000,
    marketValueCents: 1_974_000,
    weightBps: 987,
  },
  {
    symbol: "NFLX",
    companyName: "Netflix, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/netflix.com",
    sharesMicros: 28_000_000,
    marketValueCents: 1_736_000,
    weightBps: 868,
  },
  {
    symbol: "SPGI",
    companyName: "S&P Global Inc.",
    exchange: "NYSE",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/spglobal.com",
    sharesMicros: 31_840_000,
    marketValueCents: 1_592_000,
    weightBps: 796,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/microsoft.com",
    sharesMicros: 31_760_000,
    marketValueCents: 1_334_000,
    weightBps: 667,
  },
  {
    symbol: "COST",
    companyName: "Costco Wholesale Corporation",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/costco.com",
    sharesMicros: 13_530_000,
    marketValueCents: 1_326_000,
    weightBps: 663,
  },
  {
    symbol: "TXRH",
    companyName: "Texas Roadhouse, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/texasroadhouse.com",
    sharesMicros: 44_240_000,
    marketValueCents: 752_000,
    weightBps: 376,
  },
  {
    symbol: "MCO",
    companyName: "Moody's Corporation",
    exchange: "NYSE",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/moodys.com",
    sharesMicros: 16_650_000,
    marketValueCents: 716_000,
    weightBps: 358,
  },
  {
    symbol: "INTU",
    companyName: "Intuit Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/intuit.com",
    sharesMicros: 9_380_000,
    marketValueCents: 610_000,
    weightBps: 305,
  },
  {
    symbol: "DUOL",
    companyName: "Duolingo, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    logoUrl: "https://logo.clearbit.com/duolingo.com",
    sharesMicros: 6_970_000,
    marketValueCents: 244_000,
    weightBps: 122,
  },
];

export async function seedDemoPortfolioAction() {
  await upsertSnapshotWithPositions({
    asOfDate: formatIsoDate(new Date()),
    source: "manual",
    positions: DEMO_POSITIONS,
  });

  updateTag("portfolio");
}

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
