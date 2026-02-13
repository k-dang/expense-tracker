"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parse } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function toDate(dateStr: string) {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

function toDateStr(date: Date) {
  return format(date, "yyyy-MM-dd");
}

type Props = {
  range: DateRange;
};

export function DateRangeFilter({ range }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(toDate(range.from));
  const [toDateVal, setToDateVal] = useState<Date>(toDate(range.to));

  function applyRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", toDateStr(from));
    params.set("to", toDateStr(to));
    router.replace(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  const label = `${format(fromDate, "MMM d, yyyy")} – ${format(toDateVal, "MMM d, yyyy")}`;

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
          <div className="border-l p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                const today = new Date();
                setToDateVal(today);
                applyRange(fromDate, today);
              }}
            >
              Today
            </Button>
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
