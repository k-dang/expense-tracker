import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCentsWithCode } from "@/lib/format";

interface PortfolioContextBarProps {
  portfolioName: string;
  baseCurrency: string;
  snapshotDate: string;
  totalMarketValueCents: number;
  holdingsCount: number;
}

export function PortfolioContextBar({
  portfolioName,
  baseCurrency,
  snapshotDate,
  totalMarketValueCents,
  holdingsCount,
}: PortfolioContextBarProps) {
  const currency = baseCurrency === "USD" ? "USD" : "CAD";

  return (
    <div className="flex items-center gap-x-6 gap-y-3 flex-wrap rounded-xl border border-foreground/[0.06] bg-card/60 backdrop-blur-sm px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-[3px] rounded-full bg-chart-5" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{portfolioName}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Active portfolio
          </span>
        </div>
      </div>

      <div className="hidden sm:block h-6 w-px bg-foreground/10" />

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Total Value
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {formatCurrencyFromCentsWithCode(totalMarketValueCents, currency)}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Holdings
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {holdingsCount}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          As of
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {formatIsoDateLabel(snapshotDate)}
        </span>
      </div>

      <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {currency}
      </span>
    </div>
  );
}
