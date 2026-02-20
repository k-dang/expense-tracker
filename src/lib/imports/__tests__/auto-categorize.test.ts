import { describe, expect, it } from "vitest";
import { categorize } from "@/lib/imports/auto-categorize";

describe("auto-categorize", () => {
  it("matches keywords to categories", () => {
    expect(categorize("Loblaws Grocery Store")).toBe("Food");
    expect(categorize("McDonald's Restaurant")).toBe("Food");
    expect(categorize("Uber trip downtown")).toBe("Transport");
    expect(categorize("Amazon.ca purchase")).toBe("Shopping");
    expect(categorize("Netflix monthly")).toBe("Entertainment");
    expect(categorize("Rogers Internet Bill")).toBe("Utilities");
    expect(categorize("Pharmacy pickup")).toBe("Health");
  });

  it("matches case-insensitively", () => {
    expect(categorize("COSTCO WHOLESALE")).toBe("Food");
    expect(categorize("tim HORTONS")).toBe("Food");
    expect(categorize("NETFLIX")).toBe("Entertainment");
  });

  it("returns Uncategorized for no match", () => {
    expect(categorize("Some random store")).toBe("Uncategorized");
    expect(categorize("")).toBe("Uncategorized");
  });
});
