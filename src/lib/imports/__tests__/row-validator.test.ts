import { describe, expect, it } from "vitest";
import { validateRow } from "@/lib/imports/row-validator";

describe("row-validator", () => {
  it("validates import-style date format", () => {
    const valid = validateRow({
      rowNumber: 2,
      date: "02-07-2026",
      vendor: "Store",
      amount: "5.00",
      category: "Food",
    });
    expect("value" in valid).toBe(true);
    if ("value" in valid) {
      expect(valid.value.txnDate).toBe("2026-02-07");
    }

    const invalid = validateRow({
      rowNumber: 3,
      date: "2026-02-07",
      vendor: "Store",
      amount: "5.00",
      category: "Food",
    });
    expect("error" in invalid).toBe(true);
    if ("error" in invalid) {
      expect(invalid.error.field).toBe("date");
    }
  });

  it("parses amounts", () => {
    const validAmount = validateRow({
      rowNumber: 2,
      date: "01-01-2025",
      vendor: "Store",
      amount: "$1,234.56",
      category: "Food",
    });
    expect("value" in validAmount).toBe(true);
    if ("value" in validAmount) {
      expect(validAmount.value.amountCents).toBe(123456);
    }

    const invalidAmount = validateRow({
      rowNumber: 3,
      date: "01-01-2025",
      vendor: "Store",
      amount: "1e3",
      category: "Food",
    });
    expect("error" in invalidAmount).toBe(true);
    if ("error" in invalidAmount) {
      expect(invalidAmount.error.field).toBe("amount");
    }
  });

  it("normalizes display and dedup values", () => {
    const result = validateRow({
      rowNumber: 2,
      date: "01-01-2025",
      vendor: "  Cafe   Nero  ",
      amount: "5.00",
      category: "  Food   And   Drink  ",
    });
    expect("value" in result).toBe(true);
    if ("value" in result) {
      expect(result.value.vendor).toBe("Cafe Nero");
      expect(result.value.vendorDedup).toBe("cafe nero");
      expect(result.value.category).toBe("Food And Drink");
      expect(result.value.categoryDedup).toBe("food and drink");
    }
  });

  it("builds deterministic fingerprints", () => {
    const one = validateRow({
      rowNumber: 2,
      date: "01-01-2025",
      vendor: "Coffee Shop",
      amount: "15.00",
      category: "Food",
    });

    const two = validateRow({
      rowNumber: 3,
      date: "01-01-2025",
      vendor: "Coffee Shop",
      amount: "15.00",
      category: "Food",
    });

    expect("value" in one).toBe(true);
    expect("value" in two).toBe(true);
    if ("value" in one && "value" in two) {
      expect(one.value.fingerprint).toHaveLength(64);
      expect(one.value.fingerprint).toBe(two.value.fingerprint);
    }
  });

  it("returns row-level validation errors", () => {
    const valid = validateRow({
      rowNumber: 2,
      date: "01-01-2025",
      vendor: "Store",
      amount: "$5.00",
      category: "Food",
    });
    expect("value" in valid).toBe(true);

    const invalid = validateRow({
      rowNumber: 3,
      date: "bad-date",
      vendor: "",
      amount: "-1",
      category: "",
    });
    expect("error" in invalid).toBe(true);
    if ("error" in invalid) {
      expect(invalid.error.row).toBe(3);
      expect(invalid.error.field).toBe("date");
    }
  });
});
