import { parseStrictDate } from "@/lib/date/parse-strict-date";

export type DateRange = {
  from: string;
  to: string;
};

export function getDefaultDashboardDateRange(now = new Date()): DateRange {
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const toDate = new Date(Date.UTC(year, month + 1, 0));

  const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

  return {
    from: "2025-01-01",
    to: toIsoDate(toDate),
  };
}

function isValidDateRange(from: string, to: string): boolean {
  return from <= to;
}

export function resolveDashboardPageDateRange(input: {
  from?: string;
  to?: string;
}): DateRange {
  const fallbackRange = getDefaultDashboardDateRange();
  const hasFrom = Boolean(input.from);
  const hasTo = Boolean(input.to);

  if (hasFrom !== hasTo) {
    return fallbackRange;
  }

  const candidateRange =
    hasFrom && hasTo ? { from: input.from, to: input.to } : fallbackRange;
  const from = parseStrictDate(candidateRange.from ?? "");
  const to = parseStrictDate(candidateRange.to ?? "");

  if (!from || !to) {
    return fallbackRange;
  }

  if (!isValidDateRange(from, to)) {
    return fallbackRange;
  }

  return { from, to };
}
