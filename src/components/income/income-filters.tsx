"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const handleSourceChange = useCallback(
    (value: string | null) => {
      updateParams({
        source: !value || value === "__all__" ? undefined : value,
      });
    },
    [updateParams],
  );

  const handleSortToggle = useCallback(
    (field: string) => {
      if (currentSortBy === field) {
        updateParams({
          sortOrder: currentSortOrder === "desc" ? "asc" : "desc",
        });
      } else {
        updateParams({ sortBy: field, sortOrder: "desc" });
      }
    },
    [updateParams, currentSortBy, currentSortOrder],
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
            onClick={() => handleSortToggle(field)}
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
