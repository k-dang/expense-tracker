import { PortfolioBreakdownCard } from "@/components/portfolio/portfolio-breakdown-card";
import { PortfolioImportCard } from "@/components/portfolio/portfolio-import-card";
import { listLatestPortfolioBreakdown } from "@/db/queries/portfolio";
import { seedDemoPortfolioAction } from "@/lib/actions/portfolio";
import { Button } from "@/components/ui/button";

export async function PortfolioPageContent() {
  const data = await listLatestPortfolioBreakdown();

  if (!data.snapshot) {
    return (
      <div className="space-y-6">
        <PortfolioImportCard />
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm">
          <p>No portfolio snapshot yet.</p>
          <p className="text-xs">
            Add your first holdings snapshot to see a weighted breakdown.
          </p>
          <form action={seedDemoPortfolioAction} className="mt-2">
            <Button type="submit" size="sm">
              Seed demo holdings
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortfolioImportCard />
      <PortfolioBreakdownCard
        portfolio={data.portfolio}
        snapshot={data.snapshot}
        positions={data.positions}
      />
    </div>
  );
}
