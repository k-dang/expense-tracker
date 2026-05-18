import { describe, expect, it } from "vitest";
import { getProcessor } from "@/lib/imports/processors/registry";

function toBytes(text: string) {
  return new TextEncoder().encode(text);
}

const AMEX_HEADER =
  "Date,Date Processed,Description,Card Member,Account #,Amount,Foreign Spend Amount,Commission,Exchange Rate,Additional Information,Merchant,Address,City / Province,Postal Code,Country,Reference";

describe("amex-csv processor", () => {
  const processor = getProcessor("amex-csv");
  if (!processor) throw new Error("amex-csv processor not registered");

  it("parses Amex-formatted expense rows", async () => {
    const csv = `${AMEX_HEADER}
19 Mar 2026,19 Mar 2026,MEMBERSHIP FEE INSTALLMENT,KEVIN DANG,-51000,12.99,,,,,MEMBERSHIP FEE INSTALLMENT,,,,,'10000000010519999928580'
15 Mar 2026,17 Mar 2026,=STACKEDPANCAKEHOUSE 00 NORTH YORK,KEVIN DANG,-51000,44.16,,,,,=STACKEDPANCAKEHOUSE 00 NORTH YORK,2181 STEELES AVE WEST,"NORTH YORK
ON",M3J 3N2,CANADA,'AT260760006000010086680'`;

    const result = await processor.process({
      filename: "amex.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.txnDate).toBe("2026-03-19");
      expect(result.rows[0]?.description).toBe("MEMBERSHIP FEE INSTALLMENT");
      expect(result.rows[0]?.amountCents).toBe(1299);
      expect(result.rows[1]?.txnDate).toBe("2026-03-15");
      expect(result.rows[1]?.description).toBe(
        "=STACKEDPANCAKEHOUSE 00 NORTH YORK",
      );
      expect(result.rows[1]?.amountCents).toBe(4416);
    }
  });

  it("skips payment and negative amount rows", async () => {
    const csv = `${AMEX_HEADER}
23 Feb 2026,23 Feb 2026,PAYMENT RECEIVED - THANK YOU,KEVIN DANG,-51000,-575.17,,,,,PAYMENT RECEIVED - THANK YOU,,,,,'AT260540003000010053415'
23 Feb 2026,23 Feb 2026,UBER EATS               HTTPS://HELP.UB,KEVIN DANG,-51000,26.96,,,,,UBER EATS               HTTPS://HELP.UB,121 Bloor Street East 16th floor,"TORONTO
ON",M4W 1A9,CANADA,'AT260540006000010069572'`;

    const result = await processor.process({
      filename: "amex.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(1);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.description).toBe("UBER EATS HTTPS://HELP.UB");
    }
  });

  it("fails when required Amex headers are missing", async () => {
    const csv = "Date,Amount\n19 Mar 2026,12.99";

    const result = await processor.process({
      filename: "amex.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("header");
      expect(result.errors[0]?.message).toContain("description");
    }
  });

  it("fails on invalid date format", async () => {
    const csv = `${AMEX_HEADER}
2026-03-19,19 Mar 2026,MEMBERSHIP FEE INSTALLMENT,KEVIN DANG,-51000,12.99,,,,,MEMBERSHIP FEE INSTALLMENT,,,,,'10000000010519999928580'`;

    const result = await processor.process({
      filename: "amex.csv",
      contentType: "text/csv",
      bytes: toBytes(csv),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("date");
    }
  });

  it("has correct metadata", () => {
    expect(processor.metadata.id).toBe("amex-csv");
    expect(processor.metadata.label).toBe("Amex CSV");
    expect(processor.metadata.acceptedExtensions).toContain(".csv");
  });
});
