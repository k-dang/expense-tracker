import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImportFileResult } from "@/lib/types/api";

const { updateTagMock, processImportFileMock } = vi.hoisted(() => ({
  updateTagMock: vi.fn(),
  processImportFileMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: updateTagMock,
}));

const {
  importSelectedDuplicatesMock,
  deleteImportByIdMock,
  listDuplicatesByImportIdMock,
} = vi.hoisted(() => ({
  importSelectedDuplicatesMock: vi.fn(),
  deleteImportByIdMock: vi.fn(),
  listDuplicatesByImportIdMock: vi.fn(),
}));

vi.mock("@/db/queries/imports", () => ({
  processImportFile: processImportFileMock,
  deleteImportById: deleteImportByIdMock,
  importSelectedDuplicates: importSelectedDuplicatesMock,
  listDuplicatesByImportId: listDuplicatesByImportIdMock,
}));

import {
  uploadImportAction,
  importDuplicatesAction,
  deleteImportAction,
  fetchDuplicatesAction,
} from "@/lib/actions/imports";

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
    expect(updateTagMock).toHaveBeenNthCalledWith(1, "expenses");
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

describe("importDuplicatesAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    importSelectedDuplicatesMock.mockReset();
  });

  it("returns succeeded when importId and duplicateIds are valid", async () => {
    importSelectedDuplicatesMock.mockResolvedValue(3);

    const result = await importDuplicatesAction("imp-1", [
      "dup-1",
      "dup-2",
      "dup-3",
    ]);

    expect(result).toEqual({ status: "succeeded", importedCount: 3 });
    expect(importSelectedDuplicatesMock).toHaveBeenCalledWith({
      importId: "imp-1",
      duplicateIds: ["dup-1", "dup-2", "dup-3"],
    });
    expect(updateTagMock).toHaveBeenCalledTimes(2);
  });

  it("returns failed when duplicateIds is empty", async () => {
    const result = await importDuplicatesAction("imp-1", []);

    expect(result).toEqual({
      status: "failed",
      error: "No duplicates selected.",
    });
    expect(importSelectedDuplicatesMock).not.toHaveBeenCalled();
  });

  it("returns failed when importId is empty", async () => {
    const result = await importDuplicatesAction("", ["dup-1"]);

    expect(result?.status).toBe("failed");
    expect(importSelectedDuplicatesMock).not.toHaveBeenCalled();
  });
});

describe("deleteImportAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    deleteImportByIdMock.mockReset();
  });

  it("returns succeeded when importId is valid", async () => {
    deleteImportByIdMock.mockResolvedValue({
      status: "succeeded",
      importId: "imp-1",
      deletedExpenseCount: 5,
    });

    const formData = new FormData();
    formData.set("importId", "imp-1");

    const result = await deleteImportAction(null, formData);

    expect(result).toEqual({
      status: "succeeded",
      importId: "imp-1",
      deletedExpenseCount: 5,
    });
    expect(deleteImportByIdMock).toHaveBeenCalledWith({ importId: "imp-1" });
    expect(updateTagMock).toHaveBeenCalledTimes(2);
  });

  it("returns failed when importId is empty", async () => {
    const formData = new FormData();
    formData.set("importId", "   ");

    const result = await deleteImportAction(null, formData);

    expect(result).toEqual({
      status: "failed",
      error: "Import id is required.",
    });
    expect(deleteImportByIdMock).not.toHaveBeenCalled();
  });
});

describe("fetchDuplicatesAction", () => {
  beforeEach(() => {
    listDuplicatesByImportIdMock.mockReset();
  });

  it("returns duplicates when importId is valid", async () => {
    const items = [{ id: "dup-1", description: "Test" }];
    listDuplicatesByImportIdMock.mockResolvedValue(items);

    const result = await fetchDuplicatesAction("imp-1");

    expect(result).toEqual(items);
    expect(listDuplicatesByImportIdMock).toHaveBeenCalledWith({
      importId: "imp-1",
    });
  });

  it("returns empty array when importId is empty", async () => {
    const result = await fetchDuplicatesAction("");

    expect(result).toEqual([]);
    expect(listDuplicatesByImportIdMock).not.toHaveBeenCalled();
  });
});
