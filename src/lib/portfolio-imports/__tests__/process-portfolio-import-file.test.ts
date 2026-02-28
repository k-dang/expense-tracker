import { describe, expect, it } from "vitest";
import { processPortfolioImportFileInput } from "@/lib/portfolio-imports/process-portfolio-import-file";

function toBytes(value: string) {
  return new TextEncoder().encode(value);
}

describe("processPortfolioImportFileInput", () => {
  it("parses and aggregates duplicate symbols", () => {
    const result = processPortfolioImportFileInput({
      filename: "holdings.csv",
      contentType: "text/csv",
      bytes: toBytes(
        [
          "symbol,companyName,shares,marketValue,currency",
          "AAPL,Apple Inc,1.25,250.25,usd",
          "aapl,Apple Inc,0.75,149.75,USD",
          "MSFT,Microsoft Corp,2,600,USD",
        ].join("\n"),
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(3);
      expect(result.uniqueSymbols).toBe(2);
      expect(result.rows).toEqual([
        {
          symbol: "AAPL",
          companyName: "Apple Inc",
          currency: "USD",
          marketValueCents: 40_000,
        },
        {
          symbol: "MSFT",
          companyName: "Microsoft Corp",
          currency: "USD",
          marketValueCents: 60_000,
        },
      ]);
    }
  });

  it("returns header validation failures", () => {
    const result = processPortfolioImportFileInput({
      filename: "holdings.csv",
      contentType: "text/csv",
      bytes: toBytes("symbol,shares\nAAPL,1"),
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errors[0]?.field).toBe("header");
      expect(result.errors[0]?.message).toContain("Missing required headers");
    }
  });

  it("accepts files without a shares column", () => {
    const result = processPortfolioImportFileInput({
      filename: "holdings.csv",
      contentType: "text/csv",
      bytes: toBytes(
        [
          "symbol,companyName,marketValue,currency",
          "AAPL,Apple Inc,250.25,usd",
          "MSFT,Microsoft Corp,600,USD",
        ].join("\n"),
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.uniqueSymbols).toBe(2);
      expect(result.rows).toEqual([
        {
          symbol: "AAPL",
          companyName: "Apple Inc",
          currency: "USD",
          marketValueCents: 25_025,
        },
        {
          symbol: "MSFT",
          companyName: "Microsoft Corp",
          currency: "USD",
          marketValueCents: 60_000,
        },
      ]);
    }
  });

  it("ignores shares column when present", () => {
    const result = processPortfolioImportFileInput({
      filename: "holdings.csv",
      contentType: "text/csv",
      bytes: toBytes(
        [
          "symbol,companyName,shares,marketValue",
          "AAPL,Apple Inc,1.1234567,100",
        ].join("\n"),
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.rows[0]).toMatchObject({
        symbol: "AAPL",
        companyName: "Apple Inc",
        marketValueCents: 10_000,
      });
    }
  });

  it("rounds marketValue to nearest cent when more than 2 decimal places", () => {
    const result = processPortfolioImportFileInput({
      filename: "holdings.csv",
      contentType: "text/csv",
      bytes: toBytes(
        [
          "symbol,companyName,marketValue",
          "AAPL,Apple Inc,1234.5678",
          "MSFT,Microsoft Corp,100.994",
          "GOOG,Alphabet Inc,1.999",
        ].join("\n"),
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.rows[0]?.marketValueCents).toBe(123457);
      expect(result.rows[1]?.marketValueCents).toBe(10099);
      expect(result.rows[2]?.marketValueCents).toBe(200);
    }
  });

  it("accepts files with arbitrary extra columns and ignores them", () => {
    const result = processPortfolioImportFileInput({
      filename: "holdings.csv",
      contentType: "text/csv",
      bytes: toBytes(
        [
          "symbol,companyName,marketValue,notes,sector,costBasis",
          "AAPL,Apple Inc,250.50,Tech growth,Technology,200.00",
          "MSFT,Microsoft Corp,600,Enterprise,Technology,550.00",
        ].join("\n"),
      ),
    });

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.totalRows).toBe(2);
      expect(result.uniqueSymbols).toBe(2);
      expect(result.rows).toEqual([
        {
          symbol: "AAPL",
          companyName: "Apple Inc",
          marketValueCents: 25_050,
        },
        {
          symbol: "MSFT",
          companyName: "Microsoft Corp",
          marketValueCents: 60_000,
        },
      ]);
    }
  });
});
