"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/components/category-badge";
import {
  applyCategoryRuleAction,
  countMatchingExpensesAction,
  updateCategoryAction,
} from "@/lib/actions/expenses";
import { ArrowRight, Brain, Layers } from "lucide-react";

type Props = {
  expenseId: string;
  description: string;
  oldCategory: string;
  newCategory: string;
  onCancel: () => void;
  onClose: () => void;
};

export function LearnRuleDialog({
  expenseId,
  description,
  oldCategory,
  newCategory,
  onCancel,
  onClose,
}: Props) {
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [rememberRule, setRememberRule] = useState(true);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    countMatchingExpensesAction(description).then(setMatchCount);
  }, [description]);

  const handleApply = useCallback(async () => {
    setIsApplying(true);
    try {
      await updateCategoryAction(expenseId, newCategory);
      if (rememberRule) {
        await applyCategoryRuleAction(
          description,
          newCategory,
          applyToExisting,
        );
      }
      onClose();
    } finally {
      setIsApplying(false);
    }
  }, [
    expenseId,
    description,
    newCategory,
    applyToExisting,
    rememberRule,
    onClose,
  ]);

  const otherCount = matchCount !== null ? matchCount - 1 : null;

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Learn this categorization?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-mono text-foreground text-xs">
              {description}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-2 text-sm">
          <CategoryBadge category={oldCategory} />
          <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
          <CategoryBadge category={newCategory} />
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
              Apply to{" "}
              {otherCount !== null && otherCount > 0
                ? `all ${otherCount} other`
                : "all matching"}{" "}
              expenses
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
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleApply} disabled={isApplying}>
            {isApplying ? "Applying..." : "Apply"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
