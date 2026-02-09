import { describe, expect, it } from "vitest";
import { processImportFileInput } from "@/lib/imports/process-import-file";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

describe("process-import-file", () => {
  it("returns validated rows on success", () => {
    const result = processImportFileInput({
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(
        "date,vendor,amount,category\n01-01-2025,Store A,$10.00,Food\n01-02-2025,Store B,20.50,Transport",
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.amountCents).toBe(1000);
    }
  });

  it("returns all row validation errors", () => {
    const result = processImportFileInput({
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(
        "date,vendor,amount,category\n99-99-2025,,10.00,Food\n01-02-2025,Store B,-5,",
      ),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors.length).toBe(2);
      expect(result.rowCountTotal).toBe(2);
      expect(result.errors[0]?.field).toBe("date");
      expect(result.errors[1]?.field).toBe("category");
    }
  });
});
