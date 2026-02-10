"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardTopVendorItem } from "@/db/queries/dashboard";
import { formatCurrencyFromCents } from "@/lib/format";

const TOP_VENDOR_CHART_CONFIG = {
  totalCents: {
    label: "Spend",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Props = {
  data: DashboardTopVendorItem[];
};

export function TopVendorsChart({ data }: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Top vendors</CardTitle>
      </CardHeader>
      <CardContent className="h-72 min-w-0">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No vendor data for selected range.
          </p>
        ) : (
          <ChartContainer
            className="h-full w-full min-w-0 aspect-auto"
            config={TOP_VENDOR_CHART_CONFIG}
          >
            <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="vendor" width={90} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const numericValue = Array.isArray(value)
                        ? Number(value[0] ?? 0)
                        : typeof value === "number"
                          ? value
                          : Number(value ?? 0);

                      return (
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {name == null ? "Value" : String(name)}
                          </span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {formatCurrencyFromCents(numericValue)}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar
                dataKey="totalCents"
                fill="var(--color-totalCents)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
