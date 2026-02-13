import { format, isMatch, isValid, parse } from "date-fns";

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const ISO_MONTH_FORMAT = "yyyy-MM";

export function parseStrictDate(value: string): string | null {
  if (!isMatch(value, ISO_DATE_FORMAT)) {
    return null;
  }

  const parsed = parse(value, ISO_DATE_FORMAT, new Date());

  if (!isValid(parsed)) {
    return null;
  }

  return format(parsed, ISO_DATE_FORMAT) === value ? value : null;
}

function parseMonthKey(value: string): Date | null {
  if (!isMatch(value, ISO_MONTH_FORMAT)) {
    return null;
  }

  const parsed = parse(value, ISO_MONTH_FORMAT, new Date());
  return format(parsed, ISO_MONTH_FORMAT) === value ? parsed : null;
}

export function parseIsoDate(value: string): Date | null {
  if (!parseStrictDate(value)) {
    return null;
  }

  return parse(value, ISO_DATE_FORMAT, new Date());
}

export function formatIsoDate(date: Date): string {
  return format(date, ISO_DATE_FORMAT);
}

export function formatIsoDateLabel(value: string): string {
  const parsed = parseIsoDate(value);
  return parsed ? format(parsed, "MMM d, yyyy") : value;
}

export function formatDateLabel(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatMonthLabel(value: string): string {
  const parsed = parseMonthKey(value);
  return parsed ? format(parsed, "MMM yyyy") : value;
}

export function formatShortMonthLabel(value: string): string {
  const parsed = parseMonthKey(value);
  return parsed ? format(parsed, "MMM") : value;
}

export function formatUtcTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}
