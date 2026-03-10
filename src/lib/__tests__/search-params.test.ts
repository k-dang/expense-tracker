import { describe, expect, it } from "vitest";
import { parsePage } from "@/lib/search-params";

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
});
