import { findCaseInsensitive } from "@/lib/utils";

export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Health",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  Transport: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  Shopping: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  Entertainment: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  Utilities: "bg-slate-400/15 text-slate-400 border-slate-400/25",
  Health: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Uncategorized:
    "bg-zinc-500/10 text-zinc-500 border-zinc-500/30 border-dashed",
};

const CUSTOM_CATEGORY_COLOR =
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/25";

export function getCategoryColor(category: string): string {
  return (
    findCaseInsensitive(CATEGORY_COLORS, category) ?? CUSTOM_CATEGORY_COLOR
  );
}

const CATEGORY_CHART_COLORS: Record<string, string> = {
  Food: "#fb923c",
  Vacation: "#38bdf8",
  Gifts: "#a78bfa",
  Pochi: "#f472b6",
  Education: "#94a3b8",
};

export function getCategoryChartColor(category: string): string {
  return findCaseInsensitive(CATEGORY_CHART_COLORS, category) ?? "#818cf8";
}

const CATEGORY_MONTHLY_TARGETS: Record<string, number> = {
  Food: 700,
};

export function getCategoryMonthlyTarget(
  category?: string,
): number | undefined {
  if (!category) return undefined;
  return findCaseInsensitive(CATEGORY_MONTHLY_TARGETS, category);
}
