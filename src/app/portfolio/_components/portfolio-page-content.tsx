import { PortfolioBreakdownCard } from "@/components/portfolio/portfolio-breakdown-card";
import { PortfolioImportCard } from "@/components/portfolio/portfolio-import-card";
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
      </div>
    );
  }

  const positions = data.positions.map((p) => ({
    ...p,
    logoUrl: resolveLogoUrl(p.symbol, p.logoUrl),
  }));

  return (
    <div className="space-y-6">
      <PortfolioImportCard />
      <PortfolioBreakdownCard
        portfolio={data.portfolio}
        snapshot={data.snapshot}
        positions={positions}
        usdToCadRate={usdToCad}
      />
    </div>
  );
}
