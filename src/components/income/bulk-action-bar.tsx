"use client";

import { useState } from "react";
import { SourcePicker } from "@/components/income/source-picker";
import { BulkActionBarShell } from "@/components/ui/bulk-action-bar-shell";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

type Props = {
  selectedCount: number;
  sources: string[];
  isApplying?: boolean;
  onBulkSourceChange: (newSource: string) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
};

export function BulkActionBar({
  selectedCount,
  sources,
  isApplying,
  onBulkSourceChange,
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
            {isApplying ? "Applying..." : "Assign Source"}
          </Button>
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2">
              <SourcePicker
                sources={sources}
                currentSource=""
                onSelect={(src) => {
                  onBulkSourceChange(src);
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
