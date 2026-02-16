"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { bulkUpdateCategoryAction } from "@/lib/actions/transactions";
import { X, Tag } from "lucide-react";

type Props = {
  selectedCount: number;
  selectedIds: string[];
  categories: string[];
  onClearSelection: () => void;
};

export function BulkActionBar({
  selectedCount,
  selectedIds,
  categories,
  onClearSelection,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleBulkCategoryChange = useCallback(
    async (newCategory: string) => {
      setIsApplying(true);
      try {
        await bulkUpdateCategoryAction(selectedIds, newCategory);
        setShowPicker(false);
        onClearSelection();
      } finally {
        setIsApplying(false);
      }
    },
    [selectedIds, onClearSelection],
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-2.5 shadow-2xl ring-1 ring-foreground/5 backdrop-blur-xl duration-200">
      <span className="text-sm font-medium tabular-nums">
        {selectedCount} selected
      </span>

      <div className="bg-border h-5 w-px" />

      <div className="relative">
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          disabled={isApplying}
          className="gap-1.5"
        >
          <Tag className="size-3.5" />
          {isApplying ? "Applying..." : "Assign Category"}
        </Button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2">
            <CategoryPicker
              categories={categories}
              currentCategory=""
              onSelect={handleBulkCategoryChange}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClearSelection}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
