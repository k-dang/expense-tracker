"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryColor, DEFAULT_CATEGORIES } from "@/lib/categories";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";

type Props = {
  categories: string[];
  value: string;
  onValueChange: (value: string) => void;
};

export function CategoryFieldPicker({
  categories,
  value,
  onValueChange,
}: Props) {
  const [search, setSearch] = useState("");

  const allCategories = [
    ...new Set([...DEFAULT_CATEGORIES, ...categories]),
  ].filter((c) => c !== "Uncategorized");

  const filtered = search
    ? allCategories.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase()),
      )
    : allCategories;

  const isCustom =
    search.trim() !== "" &&
    !allCategories.some((c) => c.toLowerCase() === search.trim().toLowerCase());

  return (
    <Combobox
      value={value || null}
      onValueChange={(nextValue: string | null) => {
        if (nextValue) onValueChange(nextValue);
      }}
      onInputValueChange={(nextInput) => setSearch(nextInput)}
      filter={null}
      autoHighlight
    >
      <ComboboxInput
        showTrigger={false}
        placeholder="Search or create..."
        className="w-full"
      >
        {value && (
          <InputGroupAddon align="inline-start">
            <span
              className={cn(
                "inline-block size-2 shrink-0 rounded-full border",
                getCategoryColor(value),
              )}
            />
          </InputGroupAddon>
        )}
      </ComboboxInput>
      <ComboboxContent className="w-full min-w-(--anchor-width)">
        <ComboboxList>
          {filtered.map((cat) => (
            <ComboboxItem
              key={cat}
              value={cat}
              className="gap-2 px-2 py-1.5 text-xs"
            >
              <span
                className={cn(
                  "inline-block size-2 shrink-0 rounded-full border",
                  getCategoryColor(cat),
                )}
              />
              <span className="truncate">{cat}</span>
            </ComboboxItem>
          ))}
          {isCustom && (
            <ComboboxItem
              key={`create-${search.trim()}`}
              value={search.trim()}
              className="gap-2 px-2 py-1.5 text-xs"
            >
              <Plus className="size-3 shrink-0 opacity-60" />
              <span className="truncate">
                Create &ldquo;{search.trim()}&rdquo;
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
