"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
} from "date-fns";
import type { DateRange } from "@/lib/dashboard/date-range";
import { formatDateLabel, formatIsoDate, parseIsoDate } from "@/lib/date/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const presets = [
  {
    label: "Last Month",
    range: () => {
      const prev = subMonths(new Date(), 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    },
  },
  {
    label: "Last 3 Months",
    range: () => {
      const now = new Date();
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    },
  },
  {
    label: "Last 6 Months",
    range: () => {
      const now = new Date();
      return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
    },
  },
  {
    label: "Last 12 Months",
    range: () => {
      const now = new Date();
      return { from: startOfMonth(subMonths(now, 11)), to: endOfMonth(now) };
    },
  },
  {
    label: "Last 24 Months",
    range: () => {
      const now = new Date();
      return { from: startOfMonth(subMonths(now, 23)), to: endOfMonth(now) };
    },
  },
  {
    label: "This Year",
    range: () => {
      const now = new Date();
      return { from: startOfYear(now), to: endOfMonth(now) };
    },
  },
];

type Props = {
  range: DateRange;
};

export function DateRangeFilter({ range }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(
    () => parseIsoDate(range.from) ?? new Date(),
  );
  const [toDateVal, setToDateVal] = useState<Date>(
    () => parseIsoDate(range.to) ?? new Date(),
  );

  function applyRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", formatIsoDate(from));
    params.set("to", formatIsoDate(to));
    router.replace(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  const label = `${formatDateLabel(fromDate)} – ${formatDateLabel(toDateVal)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" className="justify-start font-normal" />
        }
      >
        <CalendarDays className="mr-2 size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex gap-4 p-2">
            <div className="flex flex-col gap-1">
              <span className="px-2 text-sm font-medium">From</span>
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(day) => {
                  if (day) {
                    setFromDate(day);
                    if (day > toDateVal) setToDateVal(day);
                  }
                }}
                captionLayout="dropdown"
                defaultMonth={fromDate}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="px-2 text-sm font-medium">To</span>
              <Calendar
                mode="single"
                selected={toDateVal}
                onSelect={(day) => {
                  if (day) {
                    setToDateVal(day);
                    if (day < fromDate) setFromDate(day);
                  }
                }}
                captionLayout="dropdown"
                defaultMonth={toDateVal}
              />
            </div>
          </div>
          <div className="border-l p-2 flex flex-col gap-1">
            {presets.map((p) => {
              const { from, to } = p.range();
              return (
                <Button
                  key={p.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setFromDate(from);
                    setToDateVal(to);
                    applyRange(from, to);
                  }}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="border-t p-2 text-right">
          <Button size="sm" onClick={() => applyRange(fromDate, toDateVal)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
