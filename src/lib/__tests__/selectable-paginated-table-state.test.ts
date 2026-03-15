import { describe, expect, it } from "vitest";
import {
  clearSelectedIds,
  getTotalPages,
  removeSelectedIds,
  toggleAllSelectedIds,
  toggleSelectedId,
} from "@/lib/selectable-paginated-table-state";

describe("selectable paginated table state helpers", () => {
  it("toggles an individual row selection", () => {
    expect(toggleSelectedId(new Set(), "a")).toEqual(new Set(["a"]));
    expect(toggleSelectedId(new Set(["a"]), "a")).toEqual(new Set());
  });

  it("toggles all rows on and off", () => {
    expect(toggleAllSelectedIds(new Set(), ["a", "b"])).toEqual(
      new Set(["a", "b"]),
    );
    expect(toggleAllSelectedIds(new Set(["a", "b"]), ["a", "b"])).toEqual(
      new Set(),
    );
  });

  it("clears all selected ids", () => {
    expect(clearSelectedIds()).toEqual(new Set());
  });

  it("removes deleted ids from the selection", () => {
    expect(removeSelectedIds(new Set(["a", "b", "c"]), ["b", "d"])).toEqual(
      new Set(["a", "c"]),
    );
  });

  it("calculates total pages with a minimum of one", () => {
    expect(getTotalPages(0, 25)).toBe(1);
    expect(getTotalPages(26, 25)).toBe(2);
  });
});
