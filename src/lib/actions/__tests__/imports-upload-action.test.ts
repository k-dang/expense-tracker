import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImportFileResult } from "@/lib/types/api";

const { updateTagMock, processImportFileMock } = vi.hoisted(() => ({
  updateTagMock: vi.fn(),
  processImportFileMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: updateTagMock,
}));

vi.mock("@/db/queries/imports", () => ({
  processImportFile: processImportFileMock,
  deleteImportById: vi.fn(),
  importSelectedDuplicates: vi.fn(),
  listDuplicatesByImportId: vi.fn(),
}));

import { uploadImportAction } from "@/lib/actions/imports";

function makeCsvFile(name: string) {
  return new File(["date,description,amount\n01-01-2025,Coffee,3.50"], name, {
    type: "text/csv",
  });
}

describe("uploadImportAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    processImportFileMock.mockReset();
  });

  it("returns succeeded when all files succeed", async () => {
    processImportFileMock
      .mockResolvedValueOnce({
        filename: "a.csv",
        status: "succeeded",
        importId: "a-id",
        totalRows: 2,
        insertedRows: 1,
        duplicateRows: 1,
      } satisfies ImportFileResult)
      .mockResolvedValueOnce({
        filename: "b.csv",
        status: "succeeded",
        importId: "b-id",
        totalRows: 3,
        insertedRows: 2,
        duplicateRows: 1,
      } satisfies ImportFileResult);

    const formData = new FormData();
    formData.append("file", makeCsvFile("a.csv"));
    formData.append("file", makeCsvFile("b.csv"));

    const result = await uploadImportAction(null, formData);

    expect(result.status).toBe("succeeded");
    expect(result.totalFiles).toBe(2);
    expect(result.succeededFiles).toBe(2);
    expect(result.failedFiles).toBe(0);
    expect(result.totalRows).toBe(5);
    expect(result.insertedRows).toBe(3);
    expect(result.duplicateRows).toBe(2);
    expect(updateTagMock).toHaveBeenCalledTimes(2);
    expect(updateTagMock).toHaveBeenNthCalledWith(1, "transactions");
    expect(updateTagMock).toHaveBeenNthCalledWith(2, "imports");
  });

  it("returns partial when at least one file fails", async () => {
    processImportFileMock
      .mockResolvedValueOnce({
        filename: "good.csv",
        status: "succeeded",
        importId: "good-id",
        totalRows: 2,
        insertedRows: 2,
        duplicateRows: 0,
      } satisfies ImportFileResult)
      .mockResolvedValueOnce({
        filename: "bad.csv",
        status: "failed",
        errors: [{ row: 2, field: "amount", message: "Invalid amount." }],
      } satisfies ImportFileResult);

    const formData = new FormData();
    formData.append("file", makeCsvFile("good.csv"));
    formData.append("file", makeCsvFile("bad.csv"));

    const result = await uploadImportAction(null, formData);

    expect(result.status).toBe("partial");
    expect(result.totalFiles).toBe(2);
    expect(result.succeededFiles).toBe(1);
    expect(result.failedFiles).toBe(1);
    expect(result.totalRows).toBe(2);
    expect(result.insertedRows).toBe(2);
    expect(result.duplicateRows).toBe(0);
    expect(updateTagMock).toHaveBeenCalledTimes(2);
  });

  it("returns failed when all files fail", async () => {
    processImportFileMock.mockResolvedValue({
      filename: "bad.csv",
      status: "failed",
      errors: [{ row: 0, field: "file", message: "File must be a CSV." }],
    } satisfies ImportFileResult);

    const formData = new FormData();
    formData.append("file", makeCsvFile("bad.csv"));

    const result = await uploadImportAction(null, formData);

    expect(result.status).toBe("failed");
    expect(result.succeededFiles).toBe(0);
    expect(result.failedFiles).toBe(1);
    expect(result.totalRows).toBe(0);
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("returns failed when no file is provided", async () => {
    const result = await uploadImportAction(null, new FormData());

    expect(result.status).toBe("failed");
    expect(result.totalFiles).toBe(0);
    expect(result.errors).toEqual([
      { row: 0, field: "file", message: "Missing file in form-data." },
    ]);
    expect(processImportFileMock).not.toHaveBeenCalled();
  });

  it("returns failed when file count exceeds limit", async () => {
    const formData = new FormData();
    for (let i = 0; i < 11; i += 1) {
      formData.append("file", makeCsvFile(`${i}.csv`));
    }

    const result = await uploadImportAction(null, formData);

    expect(result.status).toBe("failed");
    expect(result.totalFiles).toBe(0);
    expect(result.errors[0]?.message).toContain("up to 10");
    expect(processImportFileMock).not.toHaveBeenCalled();
  });
});
