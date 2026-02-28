import type { PortfolioImportPositionInput } from "@/lib/portfolio-imports/process-portfolio-import-file";

export type PortfolioPositionForMerge = {
  symbol: string;
  companyName: string;
  exchange?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  marketValueCents: number;
};

export type SnapshotPositionWithWeights = PortfolioPositionForMerge & {
  weightBps: number;
  sortOrder: number;
};

function computeWeightBps(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return values.map(() => 0);
  }

  const baseWeights = values.map((value) =>
    Math.floor((value * 10_000) / total),
  );
  let remaining = 10_000 - baseWeights.reduce((sum, value) => sum + value, 0);

  const remainders = values
    .map((value, index) => ({
      index,
      remainder: (value * 10_000) % total,
    }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let i = 0; i < remainders.length && remaining > 0; i += 1) {
    baseWeights[remainders[i]?.index ?? 0] += 1;
    remaining -= 1;
  }

  return baseWeights;
}

export function mergePortfolioPositions(options: {
  existingPositions: PortfolioPositionForMerge[];
  importedPositions: PortfolioImportPositionInput[];
}): SnapshotPositionWithWeights[] {
  const mergedBySymbol = new Map<string, PortfolioPositionForMerge>();

  for (const existing of options.existingPositions) {
    const symbol = existing.symbol.trim().toUpperCase();
    mergedBySymbol.set(symbol, {
      symbol,
      companyName: existing.companyName,
      exchange: existing.exchange ?? undefined,
      currency: existing.currency ?? undefined,
      logoUrl: existing.logoUrl ?? undefined,
      marketValueCents: existing.marketValueCents,
    });
  }

  for (const incoming of options.importedPositions) {
    const symbol = incoming.symbol.trim().toUpperCase();
    const existing = mergedBySymbol.get(symbol);

    if (!existing) {
      mergedBySymbol.set(symbol, {
        symbol,
        companyName: incoming.companyName,
        exchange: incoming.exchange,
        currency: incoming.currency,
        logoUrl: incoming.logoUrl,
        marketValueCents: incoming.marketValueCents,
      });
      continue;
    }

    existing.marketValueCents += incoming.marketValueCents;
    existing.companyName = incoming.companyName;
    existing.exchange = incoming.exchange ?? existing.exchange;
    existing.currency = incoming.currency ?? existing.currency;
    existing.logoUrl = incoming.logoUrl ?? existing.logoUrl;
  }

  const merged = [...mergedBySymbol.values()].sort(
    (a, b) =>
      b.marketValueCents - a.marketValueCents ||
      a.symbol.localeCompare(b.symbol),
  );

  const weights = computeWeightBps(merged.map((row) => row.marketValueCents));

  return merged.map((row, index) => ({
    ...row,
    weightBps: weights[index] ?? 0,
    sortOrder: index,
  }));
}
