import { describe, expect, it } from "vitest";
import {
  parsePage,
  parseSortBy,
  parseSortOrder,
} from "@/app/income/_lib/search-params";

describe("income search params", () => {
  it("accepts only supported sort fields", () => {
    expect(parseSortBy("date")).toBe("date");
    expect(parseSortBy("amount")).toBe("amount");
    expect(parseSortBy("source")).toBe("source");
    expect(parseSortBy("category")).toBeUndefined();
    expect(parseSortBy()).toBeUndefined();
  });

  it("accepts only supported sort orders", () => {
    expect(parseSortOrder("asc")).toBe("asc");
    expect(parseSortOrder("desc")).toBe("desc");
    expect(parseSortOrder("descending")).toBeUndefined();
  });

  it("re-exports shared page parsing", () => {
    expect(parsePage("4")).toBe(4);
    expect(parsePage("-1")).toBe(1);
  });
});
