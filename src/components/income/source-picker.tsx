"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSourceColor, DEFAULT_INCOME_SOURCES } from "@/lib/income-sources";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";

type Props = {
  sources: string[];
  currentSource: string;
  onSelect: (source: string) => void;
  onClose: () => void;
};

export function SourcePicker({
  sources,
  currentSource,
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const allSources = [...new Set([...DEFAULT_INCOME_SOURCES, ...sources])];

  const filtered = search
    ? allSources.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : allSources;

  const isCustom =
    search.trim() !== "" &&
    !allSources.some((s) => s.toLowerCase() === search.trim().toLowerCase());

  return (
    <Combobox
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      value={currentSource || null}
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
          {filtered.map((src) => (
            <ComboboxItem
              key={src}
              value={src}
              className="gap-2 px-2 py-1.5 text-xs"
            >
              <span
                className={cn(
                  "inline-block size-2 shrink-0 rounded-full border",
                  getSourceColor(src),
                )}
              />
              <span className="truncate">{src}</span>
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
