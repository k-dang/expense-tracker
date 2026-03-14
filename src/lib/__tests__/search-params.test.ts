import { describe, expect, it } from "vitest";
import { parseEnumParam, parsePage } from "@/lib/search-params";

describe("search-params", () => {
  it("defaults invalid page values to the first page", () => {
    expect(parsePage()).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });

  it("parses numeric page values with integer coercion", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("08")).toBe(8);
    expect(parsePage("3.7")).toBe(3);
  });

  it("accepts only values from the allowed enum set", () => {
    const allowed = new Set(["date", "amount"] as const);

    expect(parseEnumParam("date", allowed)).toBe("date");
    expect(parseEnumParam("amount", allowed)).toBe("amount");
    expect(parseEnumParam("source", allowed)).toBeUndefined();
    expect(parseEnumParam(undefined, allowed)).toBeUndefined();
  });
});
