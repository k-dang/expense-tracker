"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardTopDescriptionItem } from "@/db/queries/dashboard";
import { formatCurrencyFromCents } from "@/lib/format";

const TOP_DESCRIPTION_CHART_CONFIG = {
  totalCents: {
    label: "Spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type Props = {
  data: DashboardTopDescriptionItem[];
};

export function TopDescriptionsChart({ data }: Props) {
  return data.length === 0 ? (
    <p className="text-muted-foreground text-sm">No data for selected range.</p>
  ) : (
    <ChartContainer
      className="h-full w-full min-w-0 aspect-auto"
      config={TOP_DESCRIPTION_CHART_CONFIG}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 32 }}>
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatCurrencyFromCents(value)}
        />
        <YAxis
          type="category"
          dataKey="description"
          width={180}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={({ x, y, payload }) => {
            const label: string = payload.value;
            const truncated =
              label.length > 28 ? `${label.slice(0, 28)}…` : label;
            return (
              <text
                x={x}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-muted-foreground text-xs"
              >
                <title>{label}</title>
                {truncated}
              </text>
            );
          }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const numericValue = Array.isArray(value)
                  ? Number(value[0] ?? 0)
                  : typeof value === "number"
                    ? value
                    : Number(value ?? 0);
                const txnCount =
                  typeof item.payload?.count === "number"
                    ? item.payload.count
                    : null;

                return (
                  <div className="grid gap-0.5">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="text-muted-foreground truncate">
                        {name == null ? "Value" : String(name)}
                      </span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {formatCurrencyFromCents(numericValue)}
                      </span>
                    </div>
                    {txnCount != null && (
                      <span className="text-muted-foreground text-xs">
                        {txnCount} expense{txnCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="totalCents" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell
              key={data[index].description}
              fill="var(--color-totalCents)"
              fillOpacity={1 - index * 0.08}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
