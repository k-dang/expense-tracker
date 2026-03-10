import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROCESSOR_ID,
  getProcessor,
  listProcessors,
} from "@/lib/imports/processors/registry";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

describe("import processor registry", () => {
  it("resolves the default processor and delegates generic csv parsing", () => {
    const processor = getProcessor(DEFAULT_PROCESSOR_ID);

    expect(processor?.metadata).toEqual({
      id: "generic-csv",
      label: "Generic CSV",
      description:
        "CSV with exact headers: date,description,amount,category (date in MM-DD-YYYY)",
      acceptedExtensions: [".csv"],
      acceptedMimeTypes: ["text/csv", "application/vnd.ms-excel"],
    });

    const result = processor?.process({
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(
        "date,description,amount\n01-01-2025,Loblaws Grocery,10.00",
      ),
    });

    expect(result).toEqual({
      status: "succeeded",
      totalRows: 1,
      rows: [
        expect.objectContaining({
          txnDate: "2025-01-01",
          description: "Loblaws Grocery",
          amountCents: 1000,
          category: "Food",
        }),
      ],
    });
  });

  it("returns undefined for unknown processors and lists all registered ids", () => {
    expect(getProcessor("unknown-processor")).toBeUndefined();
    expect(
      listProcessors()
        .map((processor) => processor.metadata.id)
        .sort(),
    ).toEqual(["amex-pdf", "generic-csv", "rogers-csv", "wealthsimple-csv"]);
  });
});
