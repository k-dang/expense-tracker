"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Props = {
  value: "CAD" | "USD";
  onChange: (currency: "CAD" | "USD") => void;
};

const options = ["CAD", "USD"] as const;

export function PortfolioCurrencyToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(v) => v[0] && onChange(v[0] as "CAD" | "USD")}
      variant="outline"
    >
      {options.map((option) => (
        <ToggleGroupItem key={option} value={option}>
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
