"use client";

import { useState } from "react";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { BulkActionBarShell } from "@/components/ui/bulk-action-bar-shell";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

type Props = {
  selectedCount: number;
  categories: string[];
  isApplying?: boolean;
  onBulkCategoryChange: (newCategory: string) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
};

export function BulkActionBar({
  selectedCount,
  categories,
  isApplying,
  onBulkCategoryChange,
  onBulkDelete,
  onClearSelection,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <BulkActionBarShell
      selectedCount={selectedCount}
      action={
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
                onSelect={(cat) => {
                  onBulkCategoryChange(cat);
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            </div>
          )}
        </div>
      }
      onDelete={onBulkDelete}
      onClearSelection={onClearSelection}
    />
  );
}
