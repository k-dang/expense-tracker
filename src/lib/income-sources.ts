import { findCaseInsensitive } from "@/lib/utils";

export const DEFAULT_INCOME_SOURCES = ["Salary", "Other"] as const;

export type DefaultIncomeSource = (typeof DEFAULT_INCOME_SOURCES)[number];

const SOURCE_COLORS: Record<string, string> = {
  Salary: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Other: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30 border-dashed",
};

const CUSTOM_SOURCE_COLOR =
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/25";

export function getSourceColor(source: string): string {
  return findCaseInsensitive(SOURCE_COLORS, source) ?? CUSTOM_SOURCE_COLOR;
}
