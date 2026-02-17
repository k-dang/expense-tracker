import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TransactionPageContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Filters skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="bg-muted h-9 flex-1 animate-pulse rounded-md" />
        <div className="bg-muted h-9 w-40 animate-pulse rounded-md" />
        <div className="bg-muted h-9 w-28 animate-pulse rounded-md" />
        <div className="flex gap-1">
          <div className="bg-muted h-9 w-16 animate-pulse rounded-md" />
          <div className="bg-muted h-9 w-20 animate-pulse rounded-md" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-48">Category</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="bg-muted h-4 w-4 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="bg-muted h-4 w-48 animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
