"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function PortfolioImportHistoryCollapsible({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Collapsible className="rounded-lg border border-border/50 bg-muted/20">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Import History
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        </div>
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border/50 px-4 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
