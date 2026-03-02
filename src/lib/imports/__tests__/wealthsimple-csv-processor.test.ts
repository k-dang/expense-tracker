import { describe, expect, it } from "vitest";
import { getProcessor } from "@/lib/imports/processors/registry";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

const WS_HEADER = "transaction_date,post_date,type,details,amount,currency";

describe("wealthsimple-csv processor", () => {
  const processor = getProcessor("wealthsimple-csv");
  if (!processor) throw new Error("wealthsimple-csv processor not registered");

  it("parses Wealthsimple-formatted expense rows", () => {
    const csv = `${WS_HEADER}
2025-12-18,2025-12-19,Purchase,TORONTO FLORIST,45.20,CAD
2025-12-20,2025-12-21,Purchase,PRESTO FARE/QNVR5S77XL,6.60,CAD`;

    const result = processor.process({
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

  it("skips Payment rows", () => {
    const csv = `${WS_HEADER}
2025-12-15,2025-12-15,Payment,From chequing account,-503.95,CAD
2025-12-18,2025-12-19,Purchase,TORONTO FLORIST,45.20,CAD
2025-12-20,2025-12-21,Purchase,BEST BUY #980,361.59,CAD`;

    const result = processor.process({
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

  it("maps date, description, and amount correctly", () => {
    const csv = `${WS_HEADER}
2025-12-19,2025-12-21,Purchase,BEST BUY #980,361.59,CAD`;

    const result = processor.process({
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

  it("fails when required Wealthsimple headers are missing", () => {
    const csv = "transaction_date,amount\n2026-01-16,45.20";

    const result = processor.process({
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

  it("fails on empty file", () => {
    const result = processor.process({
      filename: "wealthsimple.csv",
      contentType: "text/csv",
      bytes: toBytes(""),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.message).toContain("empty");
    }
  });

  it("fails on invalid date format", () => {
    const csv = `${WS_HEADER}
01-16-2026,2026-01-19,Purchase,TORONTO FLORIST,45.20,CAD`;

    const result = processor.process({
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
});
