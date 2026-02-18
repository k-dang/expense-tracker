"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getCategoryChartColor } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Props = {
  categories: string[];
  currentCategory: string;
};

export function MonthlyTrendCategoryFilter({
  categories,
  currentCategory,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "") {
      params.delete("trendCategory");
    } else {
      params.set("trendCategory", category);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const isAll = currentCategory === "";

  return (
    <div className="scrollbar-hidden flex gap-1.5 overflow-x-auto px-6 pb-2">
      <button
        type="button"
        onClick={() => handleSelect("")}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          isAll
            ? "border-primary/25 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        All
      </button>
      {categories.map((cat) => {
        const color = getCategoryChartColor(cat);
        const isActive = currentCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => handleSelect(cat)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            style={
              isActive
                ? {
                    borderColor: `${color}40`,
                    backgroundColor: `${color}1a`,
                  }
                : undefined
            }
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            {cat}
          </button>
        );
      })}
    </div>
  );
}
