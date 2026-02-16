export const DEFAULT_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Health",
  "Housing",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Dining: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  Transport: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  Shopping: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  Entertainment: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  Utilities: "bg-slate-400/15 text-slate-400 border-slate-400/25",
  Health: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Housing: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Uncategorized:
    "bg-zinc-500/10 text-zinc-500 border-zinc-500/30 border-dashed",
};

const CUSTOM_CATEGORY_COLOR =
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/25";

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CUSTOM_CATEGORY_COLOR;
}
