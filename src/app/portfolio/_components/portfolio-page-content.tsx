import { PortfolioBreakdownCard } from "@/components/portfolio/portfolio-breakdown-card";
import { PortfolioContextBar } from "@/components/portfolio/portfolio-context-bar";
import { PortfolioImportCard } from "@/components/portfolio/portfolio-import-card";
import { PortfolioImportHistory } from "@/components/portfolio/portfolio-import-history";
import { listLatestPortfolioBreakdown } from "@/db/queries/portfolio";
import { fetchUsdCadRate } from "@/lib/exchange-rate";

function resolveLogoUrl(
  symbol: string,
  storedUrl: string | null,
): string | null {
  const token = process.env.LOGO_DEV_TOKEN;
  if (token) {
    return `https://img.logo.dev/ticker/${symbol.toLowerCase()}?token=${token}&size=64`;
  }
  return storedUrl;
}

function computeConvertedTotalCents(
  positions: { marketValueCents: number; currency: string }[],
  baseCurrency: "CAD" | "USD",
  usdToCadRate: number,
): number {
  return positions.reduce((sum, p) => {
    if (p.currency === baseCurrency) return sum + p.marketValueCents;
    if (p.currency === "USD" && baseCurrency === "CAD") {
      return sum + Math.round(p.marketValueCents * usdToCadRate);
    }
    return sum + Math.round(p.marketValueCents / usdToCadRate);
  }, 0);
}

export async function PortfolioPageContent() {
  const [data, { usdToCad }] = await Promise.all([
    listLatestPortfolioBreakdown(),
    fetchUsdCadRate(),
  ]);

  if (!data.snapshot) {
    return (
      <div className="space-y-6">
        <PortfolioImportCard />
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm">
          <p>No portfolio snapshot yet.</p>
          <p className="text-xs">
            Add your first holdings snapshot to see a weighted breakdown.
          </p>
        </div>
        <PortfolioImportHistory />
      </div>
    );
  }

  const positions = data.positions.map((p) => ({
    ...p,
    logoUrl: resolveLogoUrl(p.symbol, p.logoUrl),
  }));

  return (
    <div className="space-y-6">
      <PortfolioContextBar
        portfolioName={data.portfolio.name}
        baseCurrency={data.portfolio.baseCurrency}
        snapshotDate={data.snapshot.asOfDate}
        totalMarketValueCents={computeConvertedTotalCents(
          data.positions,
          data.portfolio.baseCurrency as "CAD" | "USD",
          usdToCad,
        )}
        holdingsCount={positions.length}
      />
      <PortfolioImportCard />
      <PortfolioBreakdownCard
        portfolio={data.portfolio}
        snapshot={data.snapshot}
        positions={positions}
        usdToCadRate={usdToCad}
      />
      <PortfolioImportHistory />
    </div>
  );
}
