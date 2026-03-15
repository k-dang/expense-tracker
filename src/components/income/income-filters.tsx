"use client";

import { useCallback } from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListQueryState } from "@/lib/use-list-query-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSourceColor } from "@/lib/income-sources";

type Props = {
  sources: string[];
  currentSource: string;
  currentSortBy: string;
  currentSortOrder: string;
};

export function IncomeFilters({
  sources,
  currentSource,
  currentSortBy,
  currentSortOrder,
}: Props) {
  const { toggleSort, updateParams } = useListQueryState({
    currentSortBy,
    currentSortOrder,
  });

  const handleSourceChange = useCallback(
    (value: string | null) => {
      updateParams({
        source: !value || value === "__all__" ? undefined : value,
      });
    },
    [updateParams],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      <Select
        value={currentSource || "__all__"}
        onValueChange={handleSourceChange}
        items={[
          { value: "__all__", label: "All sources" },
          ...sources.map((src) => ({ value: src, label: src })),
        ]}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="__all__">
              <span className="mr-1.5 inline-block size-2" />
              All sources
            </SelectItem>
            {sources.map((src) => (
              <SelectItem key={src} value={src}>
                <span
                  className={cn(
                    "mr-1.5 inline-block size-2 rounded-full self-center",
                    getSourceColor(src).split(" ")[0],
                  )}
                />
                {src}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        {(["date", "amount"] as const).map((field) => (
          <Button
            key={field}
            variant={currentSortBy === field ? "secondary" : "ghost"}
            size="sm"
            onClick={() => toggleSort(field)}
            className="gap-1 capitalize"
          >
            {field}
            <ArrowUpDown className="size-3" />
          </Button>
        ))}
      </div>
    </div>
  );
}
