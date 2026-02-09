import { describe, expect, it } from "vitest";
import { count } from "drizzle-orm";
import { importsTable, transactionsTable } from "@/db/schema";
import { deleteImportById, processImportFile } from "@/db/queries/imports";
import { createTestDb } from "@/test/db";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

describe("processImportFile integration", () => {
  it("imports valid CSV with canonical headers and $ amounts", async () => {
    const db = createTestDb();
    const csv =
      "date,vendor,amount,category\n01-01-2025,Store A,$10.00,Food\n01-02-2025,Store B,$20.50,Transport";

    const result = await processImportFile({
      db,
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.insertedRows).toBe(2);
      expect(result.duplicateRows).toBe(0);
    }

    const txCount = await db
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable);
    expect(Number(txCount[0]?.count ?? 0)).toBe(2);
  });

  it("fails all-or-nothing when one row is invalid", async () => {
    const db = createTestDb();
    const csv =
      "date,vendor,amount,category\n01-01-2025,Store A,10.00,Food\n99-99-2025,Store B,20.50,Transport";

    const result = await processImportFile({
      db,
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");

    const txCount = await db
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable);
    expect(Number(txCount[0]?.count ?? 0)).toBe(0);

    const importRows = await db.select().from(importsTable);
    expect(importRows).toHaveLength(1);
    expect(importRows[0]?.status).toBe("failed");
  });

  it("tracks duplicates across repeated imports", async () => {
    const db = createTestDb();
    const csv =
      "date,vendor,amount,category\n01-01-2025,Store A,10.00,Food\n01-02-2025,Store B,20.50,Transport";

    const first = await processImportFile({
      db,
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });
    expect(first.status).toBe("succeeded");

    const second = await processImportFile({
      db,
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(second.status).toBe("succeeded");
    if (second.status === "succeeded") {
      expect(second.insertedRows).toBe(0);
      expect(second.duplicateRows).toBe(2);
    }

    const txCount = await db
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable);
    expect(Number(txCount[0]?.count ?? 0)).toBe(2);
  });

  it("inserts only new rows for overlapping files", async () => {
    const db = createTestDb();
    const firstCsv =
      "date,vendor,amount,category\n01-01-2025,Store A,10.00,Food\n01-02-2025,Store B,20.50,Transport";
    const secondCsv =
      "date,vendor,amount,category\n01-02-2025,Store B,20.50,Transport\n01-03-2025,Store C,50.00,Rent";

    await processImportFile({
      db,
      filename: "jan-a.csv",
      contentType: "text/csv",
      bytes: toBytes(firstCsv),
    });

    const second = await processImportFile({
      db,
      filename: "jan-b.csv",
      contentType: "text/csv",
      bytes: toBytes(secondCsv),
    });

    expect(second.status).toBe("succeeded");
    if (second.status === "succeeded") {
      expect(second.totalRows).toBe(2);
      expect(second.insertedRows).toBe(1);
      expect(second.duplicateRows).toBe(1);
      expect(second.insertedRows + second.duplicateRows).toBe(second.totalRows);
    }
  });

  it("deletes a succeeded import and its linked transactions", async () => {
    const db = createTestDb();
    const csv =
      "date,vendor,amount,category\n01-01-2025,Store A,10.00,Food\n01-02-2025,Store B,20.50,Transport";

    const created = await processImportFile({
      db,
      filename: "expenses.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(created.status).toBe("succeeded");
    if (created.status !== "succeeded") {
      return;
    }

    const deleted = await deleteImportById({ db, importId: created.importId });

    expect(deleted.status).toBe("succeeded");
    if (deleted.status === "succeeded") {
      expect(deleted.importId).toBe(created.importId);
      expect(deleted.deletedTransactionCount).toBe(2);
    }

    const remainingImports = await db.select().from(importsTable);
    expect(remainingImports).toHaveLength(0);

    const txCount = await db
      .select({ count: count(transactionsTable.id) })
      .from(transactionsTable);
    expect(Number(txCount[0]?.count ?? 0)).toBe(0);
  });

  it("deletes a failed import with zero linked transactions", async () => {
    const db = createTestDb();
    const invalidCsv =
      "date,vendor,amount,category\n99-99-2025,Store A,10.00,Food";

    const created = await processImportFile({
      db,
      filename: "bad.csv",
      contentType: "text/csv",
      bytes: toBytes(invalidCsv),
    });

    expect(created.status).toBe("failed");

    const importRows = await db.select().from(importsTable);
    expect(importRows).toHaveLength(1);

    const importId = importRows[0]?.id;
    expect(importId).toBeTruthy();

    const deleted = await deleteImportById({ db, importId: importId ?? "" });
    expect(deleted.status).toBe("succeeded");
    if (deleted.status === "succeeded") {
      expect(deleted.deletedTransactionCount).toBe(0);
    }

    const remainingImports = await db.select().from(importsTable);
    expect(remainingImports).toHaveLength(0);
  });

  it("returns not-found when deleting a missing import", async () => {
    const db = createTestDb();

    const deleted = await deleteImportById({
      db,
      importId: "missing-import-id",
    });

    expect(deleted).toEqual({
      status: "failed",
      error: "Import not found.",
    });
  });
});
