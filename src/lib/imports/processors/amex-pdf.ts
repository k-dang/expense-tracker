import { Output, generateText } from "ai";
import { z } from "zod";
import type { FileProcessor } from "@/lib/imports/file-processor";
import {
  type ValidatedExpenseInput,
  validateRow,
} from "@/lib/imports/row-validator";
import type {
  ProcessImportFileInput,
  ProcessImportFileResult,
} from "@/lib/imports/process-import-file";
import type { ImportError } from "@/lib/types/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const transactionSchema = z.object({
  date: z.string().describe("Transaction date in MM-DD-YYYY format"),
  description: z.string().describe("Merchant or transaction description"),
  amount: z.string().describe("Transaction amount as a positive number"),
});

async function processAmexPdf(
  input: ProcessImportFileInput,
): Promise<ProcessImportFileResult> {
  if (!input.filename.toLowerCase().endsWith(".pdf")) {
    return {
      status: "failed",
      errors: [
        { row: 0, field: "file", message: "File must be a PDF (.pdf)." },
      ],
    };
  }

  if (
    input.contentType &&
    input.contentType !== "application/pdf" &&
    input.contentType !== "application/octet-stream"
  ) {
    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message: "File content type must be application/pdf.",
        },
      ],
    };
  }

  if (input.bytes.length > MAX_FILE_SIZE) {
    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message: "File size exceeds the 5 MB limit.",
        },
      ],
    };
  }

  if (input.bytes.length === 0) {
    return {
      status: "failed",
      errors: [{ row: 0, field: "file", message: "File is empty." }],
    };
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message: "AI_GATEWAY_API_KEY is not configured.",
        },
      ],
    };
  }

  let extracted: z.infer<typeof transactionSchema>[];
  try {
    const result = await generateText({
      model: "openai/gpt-5-nano",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following information from this Amex credit card statement: date (MM-DD-YYYY), description, amount. Exclude merchant names that contain 'PAYMENT RECEIVED - THANK YOU'. Return only the transactions as structured data.",
            },
            {
              type: "file",
              data: input.bytes,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
      output: Output.array({ element: transactionSchema }),
    });

    extracted = result.output ?? [];
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to extract transactions.";
    return {
      status: "failed",
      errors: [{ row: 0, field: "file", message }],
    };
  }

  if (extracted.length === 0) {
    return {
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message: "No transactions found in the PDF.",
        },
      ],
    };
  }

  const errors: ImportError[] = [];
  const validatedRows: ValidatedExpenseInput[] = [];

  for (let i = 0; i < extracted.length; i++) {
    const row = extracted[i];
    const result = validateRow({
      rowNumber: i + 1,
      date: row.date,
      description: row.description,
      amount: row.amount,
      category: "",
    });

    if ("error" in result) {
      errors.push(result.error);
      continue;
    }

    validatedRows.push(result.value);
  }

  if (errors.length > 0) {
    return { status: "failed", errors, rowCountTotal: extracted.length };
  }

  return {
    status: "succeeded",
    rows: validatedRows,
    totalRows: validatedRows.length,
  };
}

export const amexPdfProcessor: FileProcessor = {
  metadata: {
    id: "amex-pdf",
    label: "Amex PDF",
    description:
      "American Express credit card PDF statement. Transactions are extracted using AI.",
    acceptedExtensions: [".pdf"],
    acceptedMimeTypes: ["application/pdf"],
  },
  process: processAmexPdf,
};
