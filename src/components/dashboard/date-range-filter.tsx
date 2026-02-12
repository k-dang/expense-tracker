import { CalendarDays } from "lucide-react";
import Form from "next/form";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  range: DateRange;
};

export function DateRangeFilter({ range }: Props) {
  return (
    <Form
      action=""
      replace
      scroll={false}
      className="flex flex-wrap items-end gap-3"
    >
      <CalendarDays className="text-muted-foreground mb-1.5 size-5 shrink-0" />
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">From</span>
        <Input
          type="date"
          name="from"
          defaultValue={range.from}
          max={range.to}
          required
          className="w-36"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">To</span>
        <Input
          type="date"
          name="to"
          defaultValue={range.to}
          min={range.from}
          required
          className="w-36"
        />
      </label>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </Form>
  );
}
