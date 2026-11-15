import { describe, expect, it } from "vitest";
import { getProcessor } from "@/lib/imports/processors/registry";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

const WS_HEADER = "transaction_date,post_date,type,details,amount,currency";

describe("wealthsimple-csv processor", () => {
  const processor = getProcessor("wealthsimple-csv");
  if (!processor) throw new Error("wealthsimple-csv processor not registered");
  const wsProcessor: typeof processor = processor;

  it("parses Wealthsimple-formatted expense rows", async () => {
    const csv = `${WS_HEADER}
2025-12-18,2025-12-19,Purchase,TORONTO FLORIST,45.20,CAD
2025-12-20,2025-12-21,Purchase,PRESTO FARE/QNVR5S77XL,6.60,CAD`;

    const result = await processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.txnDate).toBe("2025-12-18");
      expect(result.rows[0]?.description).toBe("TORONTO FLORIST");
      expect(result.rows[0]?.amountCents).toBe(4520);
      expect(result.rows[1]?.txnDate).toBe("2025-12-20");
      expect(result.rows[1]?.description).toBe("PRESTO FARE/QNVR5S77XL");
      expect(result.rows[1]?.amountCents).toBe(660);
    }
  });

  it("skips Payment rows", async () => {
    const csv = `${WS_HEADER}
2025-12-15,2025-12-15,Payment,From chequing account,-503.95,CAD
2025-12-18,2025-12-19,Purchase,TORONTO FLORIST,45.20,CAD
2025-12-20,2025-12-21,Purchase,BEST BUY #980,361.59,CAD`;

    const result = await processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.description).toBe("TORONTO FLORIST");
      expect(result.rows[1]?.description).toBe("BEST BUY #980");
    }
  });

  it("maps date, description, and amount correctly", async () => {
    const csv = `${WS_HEADER}
2025-12-19,2025-12-21,Purchase,BEST BUY #980,361.59,CAD`;

    const result = await processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.rows[0]?.txnDate).toBe("2025-12-19");
      expect(result.rows[0]?.description).toBe("BEST BUY #980");
      expect(result.rows[0]?.amountCents).toBe(36159);
      expect(result.rows[0]?.fingerprint).toHaveLength(64);
    }
  });

  it("fails when required Wealthsimple headers are missing", async () => {
    const csv = "transaction_date,amount\n2026-01-16,45.20";

    const result = await processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("header");
      expect(result.errors[0]?.message).toContain("details");
    }
  });

  it("fails on empty file", async () => {
    const result = await processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(""),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.message).toContain("empty");
    }
  });

  it("fails on invalid date format", async () => {
    const csv = `${WS_HEADER}
01-16-2026,2026-01-19,Purchase,TORONTO FLORIST,45.20,CAD`;

    const result = await processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("date");
    }
  });

  it("has correct metadata", () => {
    expect(processor.metadata.id).toBe("wealthsimple-csv");
    expect(processor.metadata.label).toBe("Wealthsimple CSV");
    expect(processor.metadata.acceptedExtensions).toContain(".csv");
  });

  describe("newer export format", () => {
    const NEW_WS_HEADER =
      "transaction_date,transaction_type,status,merchant,amount,currency,notes,category";

    function process(csv: string) {
      return wsProcessor.process({
        filename: "wealthsimple-new.csv",
        contentType: "text/csv",
        bytes: toBytes(csv),
      });
    }

    it("parses negative purchase amounts using merchant as description", async () => {
      const csv = `${NEW_WS_HEADER}
2026-06-30,Purchase,Completed,Best Buy #927,-22.60,CAD,,Other shopping
2026-06-29,Purchase,Completed,Miss Qu Barbecue & Resta,-76.39,CAD,,Restaurants`;

      const result = await process(csv);

      expect(result.status).toBe("succeeded");
      if (result.status === "succeeded") {
        expect(result.totalRows).toBe(2);
        expect(result.rows[0]?.txnDate).toBe("2026-06-30");
        expect(result.rows[0]?.description).toBe("Best Buy #927");
        expect(result.rows[0]?.amountCents).toBe(2260);
        expect(result.rows[1]?.description).toBe("Miss Qu Barbecue & Resta");
        expect(result.rows[1]?.amountCents).toBe(7639);
      }
    });

    it("ignores the file category and auto-categorizes instead", async () => {
      const csv = `${NEW_WS_HEADER}
2026-06-30,Purchase,Completed,Best Buy #927,-22.60,CAD,,Other shopping
2026-06-29,Purchase,Completed,Miss Qu Barbecue & Resta,-76.39,CAD,,Restaurants`;

      const result = await process(csv);

      expect(result.status).toBe("succeeded");
      if (result.status === "succeeded") {
        expect(result.rows[0]?.category).toBe("Shopping");
        expect(result.rows[1]?.category).toBe("Uncategorized");
      }
    });

    it("skips payments and other credits", async () => {
      const csv = `${NEW_WS_HEADER}
2026-06-25,Payment,Completed,,-500.00,CAD,,
2026-06-26,Refund,Completed,Best Buy #927,22.60,CAD,,
2026-06-30,Purchase,Completed,Best Buy #927,-22.60,CAD,,`;

      const result = await process(csv);

      expect(result.status).toBe("succeeded");
      if (result.status === "succeeded") {
        expect(result.totalRows).toBe(1);
        expect(result.rows[0]?.description).toBe("Best Buy #927");
        expect(result.rows[0]?.amountCents).toBe(2260);
      }
    });

    it("skips rows that are not completed", async () => {
      const csv = `${NEW_WS_HEADER}
2026-06-30,Purchase,Pending,Best Buy #927,-22.60,CAD,,
2026-06-28,Purchase,Completed,TORONTO FLORIST,-45.20,CAD,,`;

      const result = await process(csv);

      expect(result.status).toBe("succeeded");
      if (result.status === "succeeded") {
        expect(result.totalRows).toBe(1);
        expect(result.rows[0]?.description).toBe("TORONTO FLORIST");
      }
    });

    it("fails on unsupported currencies", async () => {
      const csv = `${NEW_WS_HEADER}
2026-06-30,Purchase,Completed,Best Buy #927,-22.60,USD,,`;

      const result = await process(csv);

      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errors[0]?.message).toContain("Unsupported currency");
      }
    });

    it("fails when neither description column is present", async () => {
      const csv =
        "transaction_date,transaction_type,amount\n2026-06-30,Purchase,-22.60";

      const result = await process(csv);

      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.errors[0]?.field).toBe("header");
        expect(result.errors[0]?.message).toContain("merchant");
      }
    });
  });
});
