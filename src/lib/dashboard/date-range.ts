import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { formatIsoDate, parseStrictDate } from "@/lib/date/utils";

export type DateRange = {
  from: string;
  to: string;
};

export function getDefaultDashboardDateRange(now = new Date()): DateRange {
  const utcNow = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const toDate = endOfMonth(utcNow);
  const fromDate = startOfMonth(subMonths(utcNow, 23));

  return {
    from: formatIsoDate(fromDate),
    to: formatIsoDate(toDate),
  };
}

export function resolveDashboardPageDateRange(input: {
  from?: string;
  to?: string;
}): DateRange {
  const fallback = getDefaultDashboardDateRange();

  if (!input.from || !input.to) {
    return fallback;
  }

  const from = parseStrictDate(input.from);
  const to = parseStrictDate(input.to);

  if (!from || !to || from > to) {
    return fallback;
  }

  return { from, to };
}
