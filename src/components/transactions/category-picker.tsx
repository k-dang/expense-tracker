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

type Props = {
  categories: string[];
  currentCategory: string;
  onSelect: (category: string) => void;
  onClose: () => void;
};

export function CategoryPicker({
  categories,
  currentCategory,
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const allCategories = [
    ...new Set([...DEFAULT_CATEGORIES, ...categories]),
  ].filter((c) => c !== "Uncategorized");

  const filtered = search
    ? allCategories.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      )
    : allCategories;

  const isCustom =
    search.trim() !== "" &&
    !allCategories.some((c) => c.toLowerCase() === search.trim().toLowerCase());

  return (
    <Combobox
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      value={currentCategory || null}
      onValueChange={(value: string | null) => {
        if (value) onSelect(value);
      }}
      onInputValueChange={(value) => setSearch(value)}
      filter={null}
      autoHighlight
    >
      <ComboboxInput
        showTrigger={false}
        placeholder="Search or create..."
        className="w-48 bg-background dark:bg-background"
        autoFocus
      />
      <ComboboxContent className="w-48">
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
                  getCategoryColor(cat)
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
