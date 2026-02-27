import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PortfolioPageContentSkeleton() {
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <CardTitle>Holdings breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="bg-muted size-8 shrink-0 animate-pulse rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="bg-muted h-4 w-36 animate-pulse rounded" />
                  <div className="bg-muted h-2 w-full max-w-md animate-pulse rounded-full" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div className="bg-muted ml-auto h-4 w-12 animate-pulse rounded" />
                <div className="bg-muted ml-auto h-3 w-20 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
