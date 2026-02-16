"use client";

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/components/category-badge";
import { bulkApplyCategoryRulesAction } from "@/lib/actions/transactions";
import { Brain, Layers } from "lucide-react";

type Props = {
  descriptions: string[];
  newCategory: string;
  onClose: () => void;
};

export function BulkLearnRuleDialog({
  descriptions,
  newCategory,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(descriptions),
  );
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [rememberRule, setRememberRule] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const toggleDescription = useCallback((desc: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(desc)) {
        next.delete(desc);
      } else {
        next.add(desc);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === descriptions.length ? new Set() : new Set(descriptions),
    );
  }, [descriptions]);

  const handleApply = useCallback(async () => {
    if (!rememberRule || selected.size === 0) {
      onClose();
      return;
    }
    setIsApplying(true);
    try {
      await bulkApplyCategoryRulesAction(
        [...selected],
        newCategory,
        applyToExisting,
      );
      onClose();
    } finally {
      setIsApplying(false);
    }
  }, [selected, newCategory, applyToExisting, rememberRule, onClose]);

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Learn these categorizations?</AlertDialogTitle>
          <AlertDialogDescription className="flex items-center gap-2">
            <span>Assign matching transactions to</span>
            <CategoryBadge category={newCategory} />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {descriptions.length > 1 && (
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={toggleAll}
              className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs underline-offset-2"
            >
              {selected.size === descriptions.length
                ? "Deselect all"
                : "Select all"}
            </Button>
          )}

          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {descriptions.map((desc) => (
              <Label
                key={desc}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.has(desc)}
                  onCheckedChange={() => toggleDescription(desc)}
                />
                <span className="truncate font-mono text-xs">{desc}</span>
              </Label>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="flex cursor-pointer items-start gap-2.5 text-sm font-normal">
            <Checkbox
              checked={applyToExisting}
              onCheckedChange={(value) => setApplyToExisting(!!value)}
              className="mt-0.5"
            />
            <span className="flex items-center gap-1.5">
              <Layers className="text-muted-foreground size-3.5 shrink-0" />
              Apply to all other matching transactions
            </span>
          </Label>
          <Label className="flex cursor-pointer items-start gap-2.5 text-sm font-normal">
            <Checkbox
              checked={rememberRule}
              onCheckedChange={(value) => setRememberRule(!!value)}
              className="mt-0.5"
            />
            <span className="flex items-center gap-1.5">
              <Brain className="text-muted-foreground size-3.5 shrink-0" />
              Remember for future imports
            </span>
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Skip</AlertDialogCancel>
          <AlertDialogAction onClick={handleApply} disabled={isApplying}>
            {isApplying
              ? "Applying..."
              : `Apply ${selected.size} rule${selected.size !== 1 ? "s" : ""}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
