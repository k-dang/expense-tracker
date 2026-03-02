import { describe, expect, it } from "vitest";
import { getProcessor } from "@/lib/imports/processors/registry";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

const ROGERS_HEADER =
  "Date,Posted Date,Reference Number,Activity Type,Activity Status,Card Number,Merchant Category Description,Merchant Name,Merchant City,Merchant State or Province,Merchant Country Code,Merchant Postal Code,Amount,Rewards,Name on Card";

describe("rogers-csv processor", () => {
  const processor = getProcessor("rogers-csv");
  if (!processor) throw new Error("rogers-csv processor not registered");

  it("parses Rogers-formatted expense rows", async () => {
    const csv = `${ROGERS_HEADER}
2026-01-16,2026-01-19,"ref1",TRANS,APPROVED,************0943,Wholesale Club,COSTCO WHOLESALE W535,TORONTO,ON,CAN,M3K2C8,$7.90,,KEVIN DANG
2025-12-27,2025-12-29,"ref2",TRANS,APPROVED,************0943,Parking Lots,TORONTO PARKING AUTHOR,TORONTO,ON,CAN,M5C1R5,$20.00,,KEVIN DANG`;

    const result = await processor.process({
      filename: "rogers.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.txnDate).toBe("2026-01-16");
      expect(result.rows[0]?.description).toBe("COSTCO WHOLESALE W535");
      expect(result.rows[0]?.amountCents).toBe(790);
      expect(result.rows[0]?.category).toBe("Wholesale Club");
      expect(result.rows[1]?.txnDate).toBe("2025-12-27");
      expect(result.rows[1]?.description).toBe("TORONTO PARKING AUTHOR");
      expect(result.rows[1]?.amountCents).toBe(2000);
    }
  });

  it("skips non-expense rows (negative amounts)", async () => {
    const csv = `${ROGERS_HEADER}
2026-01-16,2026-01-19,"ref1",TRANS,APPROVED,************0943,Wholesale Club,COSTCO WHOLESALE W535,TORONTO,ON,CAN,M3K2C8,$7.90,,KEVIN DANG
2025-12-20,2025-12-23,"ref2",TRANS,APPROVED,************0943,,PAYMENT THANK YOU,,,,,-$288.83,,KEVIN DANG
2025-12-24,2025-12-29,"ref3",TRANS,APPROVED,************0943,Electronics,BEST BUY CANADA,TORONTO,ON,CAN,M3K1E3,$299.43,,KEVIN DANG`;

    const result = await processor.process({
      filename: "rogers.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.description).toBe("COSTCO WHOLESALE W535");
      expect(result.rows[1]?.description).toBe("BEST BUY CANADA");
    }
  });

  it("maps date, description, amount, and category correctly", async () => {
    const csv = `${ROGERS_HEADER}
2025-12-24,2025-12-29,"ref",TRANS,APPROVED,************0943,Electronics Stores,BEST BUY CANADA #927,TORONTO,ON,CAN,M3K 1E3,$299.43,,KEVIN DANG`;

    const result = await processor.process({
      filename: "rogers.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.rows[0]?.txnDate).toBe("2025-12-24");
      expect(result.rows[0]?.description).toBe("BEST BUY CANADA #927");
      expect(result.rows[0]?.amountCents).toBe(29943);
      expect(result.rows[0]?.category).toBe("Electronics Stores");
      expect(result.rows[0]?.fingerprint).toHaveLength(64);
    }
  });

  it("fails when required Rogers headers are missing", async () => {
    const csv = "Date,Amount\n2026-01-16,$10.00";

    const result = await processor.process({
      filename: "rogers.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("header");
      expect(result.errors[0]?.message).toContain("merchant name");
    }
  });

  it("fails on empty file", async () => {
    const result = await processor.process({
      filename: "rogers.csv",
      contentType: "text/csv",
      bytes: toBytes(""),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.message).toContain("empty");
    }
  });

  it("fails on invalid date format", async () => {
    const csv = `${ROGERS_HEADER}
01-16-2026,2026-01-19,"ref",TRANS,APPROVED,************0943,,COSTCO,TORONTO,ON,CAN,M3K2C8,$7.90,,KEVIN DANG`;

    const result = await processor.process({
      filename: "rogers.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("date");
    }
  });

  it("has correct metadata", () => {
    expect(processor.metadata.id).toBe("rogers-csv");
    expect(processor.metadata.label).toBe("Rogers Bank CSV");
    expect(processor.metadata.acceptedExtensions).toContain(".csv");
  });
});
