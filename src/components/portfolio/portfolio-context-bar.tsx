"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { formatIsoDateLabel } from "@/lib/date/utils";
import { formatCurrencyFromCentsWithCode } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/portfolio/portfolio-display";
import { PortfolioCurrencyToggle } from "@/components/portfolio/portfolio-currency-toggle";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioContextBarProps {
  portfolioName: string;
  snapshotDate: string;
  holdingsCount: number;
  totalMarketValueCents: number;
  displayCurrency: DisplayCurrency;
  onDisplayCurrencyChange: (currency: DisplayCurrency) => void;
  availableSnapshotDates: string[];
}

export function PortfolioContextBar({
  portfolioName,
  snapshotDate,
  holdingsCount,
  totalMarketValueCents,
  displayCurrency,
  onDisplayCurrencyChange,
  availableSnapshotDates,
}: PortfolioContextBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortedSnapshotDates = [...new Set(availableSnapshotDates)].sort(
    (a, b) => b.localeCompare(a),
  );

  function handleSnapshotDateChange(value: string | null) {
    if (!value) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("asOfDate", value);
    router.push(`/portfolio?${params.toString()}`);
  }

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
          {formatCurrencyFromCentsWithCode(
            totalMarketValueCents,
            displayCurrency,
          )}
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

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-foreground/10 bg-background/70 px-3 py-2 shadow-sm">
          <CalendarDays className="size-4 text-chart-5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Snapshot
          </span>
          {sortedSnapshotDates.length > 1 ? (
            <Select
              value={snapshotDate}
              onValueChange={handleSnapshotDateChange}
              items={sortedSnapshotDates.map((date) => ({
                value: date,
                label: formatIsoDateLabel(date),
              }))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 min-w-36 rounded-full border-foreground/10 bg-card px-4 font-mono font-bold tabular-nums shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {sortedSnapshotDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatIsoDateLabel(date)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <span className="rounded-full bg-card px-3 py-1.5 font-mono text-sm font-bold tabular-nums">
              {formatIsoDateLabel(snapshotDate)}
            </span>
          )}
        </div>
        <PortfolioCurrencyToggle
          value={displayCurrency}
          onChange={onDisplayCurrencyChange}
        />
      </div>
    </div>
  );
}
