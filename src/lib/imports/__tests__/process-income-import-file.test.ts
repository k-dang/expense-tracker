import { describe, expect, it } from "vitest";
import { processIncomeImportFileInput } from "@/lib/imports/process-income-import-file";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

describe("process-income-import-file", () => {
  it("returns validated rows on success", () => {
    const result = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: toBytes(
        ' date , amount , source\n01-01-2025,"$1,200.00", Employer Payroll \n01-15-2025,250.50, Tax Refund ',
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toEqual([
        expect.objectContaining({
          incomeDate: "2025-01-01",
          amountCents: 120000,
          source: "Employer Payroll",
        }),
        expect.objectContaining({
          incomeDate: "2025-01-15",
          amountCents: 25050,
          source: "Tax Refund",
        }),
      ]);
    }
  });

  it("returns all row validation errors", () => {
    const result = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: toBytes(
        "date,amount,source\n13-01-2025,50.00,Payroll\n01-01-2025,0, ",
      ),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.rowCountTotal).toBe(2);
      expect(result.errors).toEqual([
        {
          row: 2,
          field: "date",
          message: "Date must be a real calendar date in MM-DD-YYYY format.",
        },
        {
          row: 3,
          field: "source",
          message: "Source is required.",
        },
      ]);
    }
  });

  it("rejects missing required headers", () => {
    const result = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: toBytes("date,amount\n01-01-2025,100.00"),
    });

    expect(result).toEqual({
      status: "failed",
      errors: [
        {
          row: 1,
          field: "header",
          message: "Missing required headers: source.",
        },
      ],
    });
  });

  it("rejects duplicate and unexpected headers", () => {
    const duplicate = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: toBytes(
        "date,amount,source,source\n01-01-2025,100.00,Payroll,Payroll",
      ),
    });
    expect(duplicate).toEqual({
      status: "failed",
      errors: [
        {
          row: 1,
          field: "header",
          message: "Duplicate header detected.",
        },
      ],
    });

    const extra = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: toBytes(
        "date,amount,source,notes\n01-01-2025,100.00,Payroll,Recurring",
      ),
    });
    expect(extra).toEqual({
      status: "failed",
      errors: [
        {
          row: 1,
          field: "header",
          message: "Unexpected headers: notes.",
        },
      ],
    });
  });

  it("maps parse errors to CSV row numbers", () => {
    const result = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: toBytes("date,amount,source\n01-01-2025,100.00,Payroll,extra"),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]).toEqual({
        row: 2,
        field: "file",
        message:
          "CSV parse error [TooManyFields]: Too many fields: expected 3 fields but parsed 4",
      });
    }
  });

  it("rejects invalid UTF-8 bytes and non-csv files", () => {
    const invalidUtf8 = processIncomeImportFileInput({
      filename: "income.csv",
      contentType: "text/csv",
      bytes: new Uint8Array([0xc3, 0x28]),
    });
    expect(invalidUtf8).toEqual({
      status: "failed",
      errors: [
        {
          row: 0,
          field: "file",
          message: "File must be valid UTF-8 text.",
        },
      ],
    });

    const wrongType = processIncomeImportFileInput({
      filename: "income.txt",
      contentType: "text/plain",
      bytes: toBytes("date,amount,source\n01-01-2025,100.00,Payroll"),
    });
    expect(wrongType).toEqual({
      status: "failed",
      errors: [{ row: 0, field: "file", message: "File must be a CSV." }],
    });
  });
});
