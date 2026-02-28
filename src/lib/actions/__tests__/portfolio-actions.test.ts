import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTagMock, mergeSnapshotPositionsFromImportMock } = vi.hoisted(
  () => ({
    updateTagMock: vi.fn(),
    mergeSnapshotPositionsFromImportMock: vi.fn(),
  }),
);

vi.mock("next/cache", () => ({
  updateTag: updateTagMock,
}));

vi.mock("@/db/queries/portfolio", () => {
  class DuplicatePortfolioImportError extends Error {
    constructor(
      message = "This file was already imported for this portfolio/date.",
    ) {
      super(message);
      this.name = "DuplicatePortfolioImportError";
    }
  }

  return {
    DuplicatePortfolioImportError,
    mergeSnapshotPositionsFromImport: mergeSnapshotPositionsFromImportMock,
    upsertSnapshotWithPositions: vi.fn(),
  };
});

import { uploadPortfolioCsvAction } from "@/lib/actions/portfolio";
import { DuplicatePortfolioImportError } from "@/db/queries/portfolio";

function makeFile(contents: string, name = "holdings.csv") {
  return new File([contents], name, { type: "text/csv" });
}

describe("uploadPortfolioCsvAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    mergeSnapshotPositionsFromImportMock.mockReset();
  });

  it("returns succeeded for valid upload", async () => {
    mergeSnapshotPositionsFromImportMock.mockResolvedValue({
      positionCount: 3,
      importedRows: 2,
    });

    const formData = new FormData();
    formData.set("asOfDate", "2026-02-27");
    formData.set(
      "file",
      makeFile(
        "symbol,companyName,marketValue\nAAPL,Apple Inc,250\nMSFT,Microsoft Corp,500",
      ),
    );

    const result = await uploadPortfolioCsvAction(null, formData);

    expect(result?.status).toBe("succeeded");
    if (result?.status === "succeeded") {
      expect(result.importedRows).toBe(2);
      expect(result.totalPortfolioSymbols).toBe(3);
      expect(result.mergedSymbols).toBe(2);
    }

    expect(mergeSnapshotPositionsFromImportMock).toHaveBeenCalledTimes(1);
    expect(updateTagMock).toHaveBeenCalledWith("portfolio");
  });

  it("returns failed for duplicate filename", async () => {
    mergeSnapshotPositionsFromImportMock.mockRejectedValue(
      new DuplicatePortfolioImportError(),
    );

    const formData = new FormData();
    formData.set("asOfDate", "2026-02-27");
    formData.set(
      "file",
      makeFile("symbol,companyName,shares,marketValue\nAAPL,Apple Inc,1,100"),
    );

    const result = await uploadPortfolioCsvAction(null, formData);

    expect(result?.status).toBe("failed");
    if (result?.status === "failed") {
      expect(result.errors[0]?.message).toContain("already imported");
    }
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("returns generic error and logs context for unexpected failures", async () => {
    const unexpectedError = new Error("Database connection lost");
    mergeSnapshotPositionsFromImportMock.mockRejectedValue(unexpectedError);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const formData = new FormData();
    formData.set("asOfDate", "2026-02-27");
    formData.set(
      "file",
      makeFile(
        "symbol,companyName,marketValue\nAAPL,Apple Inc,250\nMSFT,Microsoft Corp,500",
      ),
    );

    const result = await uploadPortfolioCsvAction(null, formData);

    expect(result?.status).toBe("failed");
    if (result?.status === "failed") {
      expect(result.errors[0]?.message).toBe(
        "Portfolio import failed. Try again.",
      );
    }
    expect(updateTagMock).not.toHaveBeenCalled();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[portfolio-import] Unexpected failure:",
      expect.objectContaining({
        filename: "holdings.csv",
        asOfDate: "2026-02-27",
        totalRows: 2,
        uniqueSymbols: 2,
        name: "Error",
        message: "Database connection lost",
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
