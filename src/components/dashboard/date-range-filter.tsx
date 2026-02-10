import Form from "next/form";
import type { DateRange } from "@/lib/dashboard/date-range";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  range: DateRange;
};

export function DateRangeFilter({ range }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Date range</CardTitle>
        <CardDescription>
          Filter totals and charts by transaction date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          action=""
          replace
          scroll={false}
          className="grid gap-3 sm:grid-cols-2 sm:items-end"
        >
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">From</span>
            <Input
              type="date"
              name="from"
              defaultValue={range.from}
              max={range.to}
              required
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
            />
          </label>
          <Button type="submit" className="sm:col-span-2 sm:justify-self-start">
            Apply range
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
