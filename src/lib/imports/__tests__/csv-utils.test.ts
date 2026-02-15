import { describe, expect, it } from "vitest";
import {
  decodeCsvBytes,
  parseCsvText,
  validateCsvFileInput,
} from "@/lib/imports/csv-utils";

describe("csv-utils", () => {
  it("parses canonical CSV", () => {
    const parsed = parseCsvText(
      "date,description,amount,category\n01-01-2025,Store,5.00,Food",
    );
    expect("field" in parsed).toBe(false);
    if (!("field" in parsed)) {
      expect(parsed.rows).toHaveLength(1);
      expect(parsed.rows[0]).toEqual({
        date: "01-01-2025",
        description: "Store",
        amount: "5.00",
        category: "Food",
      });
    }
  });

  it("parses CSV without optional category column", () => {
    const parsed = parseCsvText(
      "date,description,amount\n01-01-2025,Store,5.00",
    );
    expect("field" in parsed).toBe(false);
    if (!("field" in parsed)) {
      expect(parsed.rows).toHaveLength(1);
      expect(parsed.rows[0]).toEqual({
        date: "01-01-2025",
        description: "Store",
        amount: "5.00",
        category: "",
      });
    }
  });

  it("rejects non-canonical headers", () => {
    const missing = parseCsvText("description,amount\n Store,5.00");
    expect("field" in missing).toBe(true);
    if ("field" in missing) {
      expect(missing.field).toBe("header");
      expect(missing.message).toContain("Missing required headers");
    }

    const extra = parseCsvText(
      "date,description,amount,category,notes\n01-01-2025,Store,5.00,Food,n/a",
    );
    expect("field" in extra).toBe(true);
    if ("field" in extra) {
      expect(extra.field).toBe("header");
      expect(extra.message).toContain("Unexpected headers");
    }
  });

  it("rejects duplicate headers", () => {
    const duplicate = parseCsvText(
      "date,description,amount,category,date\n01-01-2025,Store,5.00,Food,01-01-2025",
    );
    expect("field" in duplicate).toBe(true);
    if ("field" in duplicate) {
      expect(duplicate.field).toBe("header");
      expect(duplicate.message).toContain("Duplicate header detected");
    }
  });

  it("catches malformed CSV and field mismatch rows", () => {
    const malformed = parseCsvText(
      'date,description,amount,category\n"01-01-2025,Store,5.00,Food',
    );
    expect("field" in malformed).toBe(true);

    const tooManyFields = parseCsvText(
      "date,description,amount,category\n01-01-2025,Store,5.00,Food,unexpected",
    );
    expect("field" in tooManyFields).toBe(true);
  });

  it("validates file input metadata", () => {
    expect(
      validateCsvFileInput({
        filename: "expenses.csv",
        contentType: "text/csv",
        bytes: new Uint8Array([1]),
      }),
    ).toBeNull();

    expect(
      validateCsvFileInput({
        filename: "expenses.txt",
        contentType: "text/plain",
        bytes: new Uint8Array([1]),
      }),
    ).toEqual({ row: 0, field: "file", message: "File must be a CSV." });
  });

  it("decodes UTF-8 bytes and reports decode failures", () => {
    const decoded = decodeCsvBytes(
      new TextEncoder().encode("date,description"),
    );
    expect(decoded.ok).toBe(true);

    const invalidUtf8 = new Uint8Array([0xc3, 0x28]);
    const invalid = decodeCsvBytes(invalidUtf8);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.message).toBe("File must be valid UTF-8 text.");
    }
  });
});
