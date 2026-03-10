import { describe, expect, it } from "vitest";
import { validateIncomeRow } from "@/lib/imports/income-row-validator";

describe("income-row-validator", () => {
  it("validates import-style dates", () => {
    const valid = validateIncomeRow({
      rowNumber: 2,
      date: "02-07-2026",
      amount: "5.00",
      source: "Payroll",
    });
    expect("value" in valid).toBe(true);
    if ("value" in valid) {
      expect(valid.value.incomeDate).toBe("2026-02-07");
    }

    const invalid = validateIncomeRow({
      rowNumber: 3,
      date: "2026-02-07",
      amount: "5.00",
      source: "Payroll",
    });
    expect("error" in invalid).toBe(true);
    if ("error" in invalid) {
      expect(invalid.error).toEqual({
        row: 3,
        field: "date",
        message: "Date must be a real calendar date in MM-DD-YYYY format.",
      });
    }
  });

  it("parses amounts with optional currency symbols and commas", () => {
    const withCurrency = validateIncomeRow({
      rowNumber: 2,
      date: "01-01-2025",
      amount: "$1,234.5",
      source: "Bonus",
    });
    expect("value" in withCurrency).toBe(true);
    if ("value" in withCurrency) {
      expect(withCurrency.value.amountCents).toBe(123450);
    }

    const wholeAmount = validateIncomeRow({
      rowNumber: 3,
      date: "01-01-2025",
      amount: "99",
      source: "Refund",
    });
    expect("value" in wholeAmount).toBe(true);
    if ("value" in wholeAmount) {
      expect(wholeAmount.value.amountCents).toBe(9900);
    }
  });

  it("rejects invalid amount formats", () => {
    const tooManyDecimals = validateIncomeRow({
      rowNumber: 2,
      date: "01-01-2025",
      amount: "10.999",
      source: "Payroll",
    });
    expect("error" in tooManyDecimals).toBe(true);

    const zero = validateIncomeRow({
      rowNumber: 3,
      date: "01-01-2025",
      amount: "0",
      source: "Payroll",
    });
    expect("error" in zero).toBe(true);

    const scientific = validateIncomeRow({
      rowNumber: 4,
      date: "01-01-2025",
      amount: "1e3",
      source: "Payroll",
    });
    expect("error" in scientific).toBe(true);

    for (const result of [tooManyDecimals, zero, scientific]) {
      if ("error" in result) {
        expect(result.error.field).toBe("amount");
      }
    }
  });

  it("normalizes source display text", () => {
    const result = validateIncomeRow({
      rowNumber: 2,
      date: "01-01-2025",
      amount: "1500.00",
      source: "  Employer   Payroll  ",
    });

    expect("value" in result).toBe(true);
    if ("value" in result) {
      expect(result.value.source).toBe("Employer Payroll");
    }
  });

  it("builds stable fingerprints across source casing and spacing", () => {
    const first = validateIncomeRow({
      rowNumber: 2,
      date: "01-01-2025",
      amount: "1500.00",
      source: "Employer Payroll",
    });
    const second = validateIncomeRow({
      rowNumber: 3,
      date: "01-01-2025",
      amount: "1500.00",
      source: "  employer   payroll  ",
    });
    const changed = validateIncomeRow({
      rowNumber: 4,
      date: "01-01-2025",
      amount: "1501.00",
      source: "Employer Payroll",
    });

    expect("value" in first).toBe(true);
    expect("value" in second).toBe(true);
    expect("value" in changed).toBe(true);
    if ("value" in first && "value" in second && "value" in changed) {
      expect(first.value.fingerprint).toHaveLength(64);
      expect(first.value.fingerprint).toBe(second.value.fingerprint);
      expect(first.value.fingerprint).not.toBe(changed.value.fingerprint);
    }
  });

  it("rejects blank and overlong sources", () => {
    const blank = validateIncomeRow({
      rowNumber: 2,
      date: "01-01-2025",
      amount: "10.00",
      source: "   ",
    });
    expect("error" in blank).toBe(true);
    if ("error" in blank) {
      expect(blank.error).toEqual({
        row: 2,
        field: "source",
        message: "Source is required.",
      });
    }

    const tooLong = validateIncomeRow({
      rowNumber: 3,
      date: "01-01-2025",
      amount: "10.00",
      source: "x".repeat(151),
    });
    expect("error" in tooLong).toBe(true);
    if ("error" in tooLong) {
      expect(tooLong.error).toEqual({
        row: 3,
        field: "source",
        message: "Source exceeds maximum length of 150 characters.",
      });
    }
  });
});
