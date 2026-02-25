import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTagMock, createExpenseMock, deleteExpensesMock } = vi.hoisted(
  () => ({
    updateTagMock: vi.fn(),
    createExpenseMock: vi.fn(),
    deleteExpensesMock: vi.fn(),
  }),
);

vi.mock("next/cache", () => ({
  updateTag: updateTagMock,
}));

vi.mock("@/db/queries/category-rules", () => ({
  upsertCategoryRule: vi.fn(),
}));

vi.mock("@/db/queries/expenses", () => ({
  createExpense: createExpenseMock,
  deleteExpenses: deleteExpensesMock,
  updateExpenseCategory: vi.fn(),
  bulkUpdateExpenseCategories: vi.fn(),
  applyRuleToMatchingExpenses: vi.fn(),
  countExpensesByDescription: vi.fn(),
}));

import {
  createExpenseAction,
  deleteExpensesAction,
} from "@/lib/actions/expenses";

describe("createExpenseAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    createExpenseMock.mockReset();
  });

  it("returns success with expenseId when form data is valid", async () => {
    createExpenseMock.mockResolvedValue("exp-123");

    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "Coffee");
    formData.set("amount", "3.50");
    formData.set("category", "Food");

    const result = await createExpenseAction(null, formData);

    expect(result).toEqual({ status: "success", expenseId: "exp-123" });
    expect(createExpenseMock).toHaveBeenCalledWith({
      txnDate: "2025-01-15",
      description: "Coffee",
      amountCents: 350,
      category: "Food",
    });
    expect(updateTagMock).toHaveBeenCalledWith("expenses");
  });

  it("returns error with field errors when date is invalid", async () => {
    const formData = new FormData();
    formData.set("date", "invalid");
    formData.set("description", "Coffee");
    formData.set("amount", "3.50");
    formData.set("category", "Food");

    const result = await createExpenseAction(null, formData);

    expect(result).toEqual({
      status: "error",
      errors: { date: "Valid date is required." },
    });
    expect(createExpenseMock).not.toHaveBeenCalled();
  });

  it("returns error when description is empty", async () => {
    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "   ");
    formData.set("amount", "3.50");
    formData.set("category", "Food");

    const result = await createExpenseAction(null, formData);

    expect(result?.status).toBe("error");
    expect(result?.errors?.description).toBe("Description is required.");
    expect(createExpenseMock).not.toHaveBeenCalled();
  });

  it("returns error when amount is not a positive number", async () => {
    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "Coffee");
    formData.set("amount", "0");
    formData.set("category", "Food");

    const result = await createExpenseAction(null, formData);

    expect(result?.status).toBe("error");
    expect(result?.errors?.amount).toBe("Amount must be a positive number.");
    expect(createExpenseMock).not.toHaveBeenCalled();
  });

  it("returns error when category is empty", async () => {
    const formData = new FormData();
    formData.set("date", "2025-01-15");
    formData.set("description", "Coffee");
    formData.set("amount", "3.50");
    formData.set("category", "");

    const result = await createExpenseAction(null, formData);

    expect(result?.status).toBe("error");
    expect(result?.errors?.category).toBe("Category is required.");
    expect(createExpenseMock).not.toHaveBeenCalled();
  });
});

describe("deleteExpensesAction", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    deleteExpensesMock.mockReset();
  });

  it("returns succeeded when expenseIds are valid", async () => {
    deleteExpensesMock.mockResolvedValue(2);

    const result = await deleteExpensesAction(["id-1", "id-2"]);

    expect(result).toEqual({ status: "success", deletedCount: 2 });
    expect(deleteExpensesMock).toHaveBeenCalledWith(["id-1", "id-2"]);
    expect(updateTagMock).toHaveBeenCalledWith("expenses");
  });

  it("returns error when expenseIds is empty", async () => {
    const result = await deleteExpensesAction([]);

    expect(result).toEqual({
      status: "error",
      error: "No expenses selected.",
    });
    expect(deleteExpensesMock).not.toHaveBeenCalled();
  });
});
