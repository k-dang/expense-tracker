import { describe, expect, it } from "vitest";
import {
  parsePage,
  parseSortBy,
  parseSortOrder,
} from "@/app/expenses/_lib/search-params";

describe("expense search params", () => {
  it("accepts only supported sort fields", () => {
    expect(parseSortBy("date")).toBe("date");
    expect(parseSortBy("amount")).toBe("amount");
    expect(parseSortBy("description")).toBe("description");
    expect(parseSortBy("category")).toBe("category");
    expect(parseSortBy("merchant")).toBeUndefined();
    expect(parseSortBy()).toBeUndefined();
  });

  it("accepts only supported sort orders", () => {
    expect(parseSortOrder("asc")).toBe("asc");
    expect(parseSortOrder("desc")).toBe("desc");
    expect(parseSortOrder("descending")).toBeUndefined();
  });

  it("re-exports shared page parsing", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage("0")).toBe(1);
  });
});
