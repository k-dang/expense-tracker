"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useRef, useEffect, useState } from "react";
import { ArrowUpDown, Search, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategoryColor } from "@/lib/categories";

type Props = {
  categories: string[];
  currentSearch: string;
  currentCategory: string;
  currentSortBy: string;
  currentSortOrder: string;
};

export function TransactionFilters({
  categories,
  currentSearch,
  currentCategory,
  currentSortBy,
  currentSortOrder,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [_, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

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
    [router, pathname, searchParams]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParams({ search: value || undefined });
      }, 300);
    },
    [updateParams]
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      updateParams({
        category: !value || value === "__all__" ? undefined : value,
      });
    },
    [updateParams]
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
    [updateParams, currentSortBy, currentSortOrder]
  );

  const showUncategorized = currentCategory === "Uncategorized";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      <InputGroup className="flex-1">
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <Search className="size-4" />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder="Search descriptions..."
          value={searchValue}
          onChange={handleSearchChange}
        />
        {searchValue && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setSearchValue("");
                updateParams({ search: undefined });
              }}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <Select
        value={currentCategory || "__all__"}
        onValueChange={handleCategoryChange}
        items={[
          { value: "__all__", label: "All categories" },
          ...categories.map((cat) => ({ value: cat, label: cat })),
        ]}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="__all__">
              <span className="mr-1.5 inline-block size-2" />
              All categories
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                <span
                  className={cn(
                    "mr-1.5 inline-block size-2 rounded-full self-center",
                    getCategoryColor(cat).split(" ")[0]
                  )}
                />
                {cat}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        variant={showUncategorized ? "default" : "outline"}
        size="sm"
        onClick={() =>
          updateParams({
            category: showUncategorized ? undefined : "Uncategorized",
          })
        }
        className={cn(
          "gap-1.5",
          showUncategorized &&
            "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25 border"
        )}
      >
        <CircleAlert className="size-3.5" />
        Uncategorized
      </Button>

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
