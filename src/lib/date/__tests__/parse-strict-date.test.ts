import { describe, expect, it } from "vitest";
import { parseStrictDate } from "@/lib/date/utils";

describe("parseStrictDate", () => {
  it("accepts valid ISO calendar dates", () => {
    expect(parseStrictDate("2026-02-07")).toBe("2026-02-07");
    expect(parseStrictDate("2024-02-29")).toBe("2024-02-29");
  });

  it("rejects invalid formatting or impossible dates", () => {
    expect(parseStrictDate("2026-2-7")).toBeNull();
    expect(parseStrictDate("02-07-2026")).toBeNull();
    expect(parseStrictDate("2026-02-30")).toBeNull();
  });
});
