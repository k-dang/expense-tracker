import { describe, expect, it } from "vitest";
import {
  applyQueryParamUpdates,
  buildPathWithSearchParams,
  getPageParamUpdate,
  getSortToggleUpdates,
} from "@/lib/list-query-state";

describe("list query state helpers", () => {
  it("removes empty values and resets page by default", () => {
    const result = applyQueryParamUpdates("search=rent&page=3&category=Food", {
      search: undefined,
      category: "Travel",
    });

    expect(result.toString()).toBe("category=Travel");
  });

  it("preserves page when resetPage is disabled", () => {
    const result = applyQueryParamUpdates(
      "search=rent&page=3",
      getPageParamUpdate(4),
      { resetPage: false },
    );

    expect(result.toString()).toBe("search=rent&page=4");
  });

  it("toggles sort order for the active field", () => {
    expect(getSortToggleUpdates("date", "date", "desc")).toEqual({
      sortOrder: "asc",
    });
    expect(getSortToggleUpdates("date", "date", "asc")).toEqual({
      sortOrder: "desc",
    });
  });

  it("sets sort field and resets sort order for a new field", () => {
    expect(getSortToggleUpdates("amount", "date", "asc")).toEqual({
      sortBy: "amount",
      sortOrder: "desc",
    });
  });

  it("builds pathnames with and without search params", () => {
    expect(
      buildPathWithSearchParams("/expenses", new URLSearchParams("page=2")),
    ).toBe("/expenses?page=2");
    expect(
      buildPathWithSearchParams("/expenses", new URLSearchParams()),
    ).toBe("/expenses");
  });
});
