"use client";

import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";

type Props = {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
};

export function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onClearSelection,
}: Props) {
  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-2.5 shadow-2xl ring-1 ring-foreground/5 backdrop-blur-xl duration-200">
      <span className="text-sm font-medium tabular-nums">
        {selectedCount} selected
      </span>

      <div className="bg-border h-5 w-px" />

      <Button
        variant="destructive"
        size="sm"
        onClick={onBulkDelete}
        className="gap-1.5"
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>

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
