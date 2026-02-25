import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTagMock, createTransactionMock, deleteTransactionsMock } =
  vi.hoisted(() => ({
    updateTagMock: vi.fn(),
    createTransactionMock: vi.fn(),
    deleteTransactionsMock: vi.fn(),
  }));

vi.mock("next/cache", () => ({
  updateTag: updateTagMock,
}));

vi.mock("@/db/queries/category-rules", () => ({
  upsertCategoryRule: vi.fn(),
}));

vi.mock("@/db/queries/transactions", () => ({
  createTransaction: createTransactionMock,
  deleteTransactions: deleteTransactionsMock,
  updateTransactionCategory: vi.fn(),
  bulkUpdateTransactionCategories: vi.fn(),
  applyRuleToMatchingTransactions: vi.fn(),
  countTransactionsByDescription: vi.fn(),
}));

import {
  createTransactionAction,
  deleteTransactionsAction,
} from "@/lib/actions/transactions";

describe("createTransactionAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    createTransactionMock.mockReset();
  });

  it("returns success with txnId when form data is valid", async () => {
    createTransactionMock.mockResolvedValue("txn-123");

    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "Coffee");
    formData.set("amount", "3.50");
    formData.set("category", "Food");

    const result = await createTransactionAction(null, formData);

    expect(result).toEqual({ status: "success", txnId: "txn-123" });
    expect(createTransactionMock).toHaveBeenCalledWith({
      txnDate: "2025-01-15",
      description: "Coffee",
      amountCents: 350,
      category: "Food",
    });
    expect(updateTagMock).toHaveBeenCalledWith("transactions");
  });

  it("returns error with field errors when date is invalid", async () => {
    const formData = new FormData();
    formData.set("date", "invalid");
    formData.set("description", "Coffee");
    formData.set("amount", "3.50");
    formData.set("category", "Food");

    const result = await createTransactionAction(null, formData);

    expect(result).toEqual({
      status: "error",
      errors: { date: "Valid date is required." },
    });
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("returns error when description is empty", async () => {
    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "   ");
    formData.set("amount", "3.50");
    formData.set("category", "Food");

    const result = await createTransactionAction(null, formData);

    expect(result?.status).toBe("error");
    expect(result?.errors?.description).toBe("Description is required.");
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("returns error when amount is not a positive number", async () => {
    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "Coffee");
    formData.set("amount", "0");
    formData.set("category", "Food");

    const result = await createTransactionAction(null, formData);

    expect(result?.status).toBe("error");
    expect(result?.errors?.amount).toBe("Amount must be a positive number.");
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("returns error when category is empty", async () => {
    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "Coffee");
    formData.set("amount", "3.50");
    formData.set("category", "");

    const result = await createTransactionAction(null, formData);

    expect(result?.status).toBe("error");
    expect(result?.errors?.category).toBe("Category is required.");
    expect(createTransactionMock).not.toHaveBeenCalled();
  });
});

describe("deleteTransactionsAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    deleteTransactionsMock.mockReset();
  });

  it("returns succeeded when txnIds are valid", async () => {
    deleteTransactionsMock.mockResolvedValue(2);

    const result = await deleteTransactionsAction(["id-1", "id-2"]);

    expect(result).toEqual({ status: "success", deletedCount: 2 });
    expect(deleteTransactionsMock).toHaveBeenCalledWith(["id-1", "id-2"]);
    expect(updateTagMock).toHaveBeenCalledWith("transactions");
  });

  it("returns error when txnIds is empty", async () => {
    const result = await deleteTransactionsAction([]);

    expect(result).toEqual({
      status: "error",
      error: "No expenses selected.",
    });
    expect(deleteTransactionsMock).not.toHaveBeenCalled();
  });
});
