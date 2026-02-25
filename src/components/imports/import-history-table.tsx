import { listImports } from "@/db/queries/imports";
import { DeleteImportDialog } from "@/components/imports/delete-import-dialog";
import { ViewDuplicatesDialog } from "@/components/imports/view-duplicates-dialog";
import { formatUtcTimestampShort } from "@/lib/date/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function TruncateCell({
  text,
  maxWidth = "12rem",
  className,
}: {
  text: string;
  maxWidth?: string;
  className?: string;
}) {
  return (
    <span
      className={`block truncate ${className ?? ""}`}
      style={{ maxWidth }}
      title={text}
    >
      {text}
    </span>
  );
}

export async function ImportHistoryTable() {
  const imports = await listImports();

  if (imports.length === 0) {
    return <p className="text-sm text-muted-foreground">No imports yet.</p>;
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="text-muted-foreground hover:bg-transparent">
          <TableHead className="w-28">Date</TableHead>
          <TableHead className="w-40">File</TableHead>
          <TableHead className="w-36">Result</TableHead>
          <TableHead className="hidden w-14 text-right md:table-cell">Total</TableHead>
          <TableHead className="hidden w-14 text-right md:table-cell">New</TableHead>
          <TableHead className="w-14">Dup</TableHead>
          <TableHead className="w-20 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {imports.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="w-28 overflow-hidden">
              <span className="block truncate" title={formatUtcTimestampShort(item.uploadedAt)}>
                {formatUtcTimestampShort(item.uploadedAt)}
              </span>
            </TableCell>
            <TableCell className="w-40 overflow-hidden">
              <TruncateCell text={item.filename} />
            </TableCell>
            <TableCell className="w-36">
              <div className="flex flex-col gap-0.5">
                <Badge
                  variant={item.status === "succeeded" ? "default" : "destructive"}
                  className="w-fit"
                >
                  {item.status}
                </Badge>
                {item.errorMessage ? (
                  <TruncateCell
                    text={item.errorMessage}
                    maxWidth="14rem"
                    className="text-muted-foreground text-xs"
                  />
                ) : null}
              </div>
            </TableCell>
            <TableCell className="hidden w-14 text-right tabular-nums md:table-cell">
              {item.rowCountTotal}
            </TableCell>
            <TableCell className="hidden w-14 text-right tabular-nums md:table-cell">
              {item.rowCountInserted}
            </TableCell>
            <TableCell className="w-14">
              <ViewDuplicatesDialog
                importId={item.id}
                duplicateCount={item.rowCountDuplicates}
              />
            </TableCell>
            <TableCell className="w-20 text-right">
              <DeleteImportDialog importId={item.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ImportHistoryTableSkeleton() {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="text-muted-foreground hover:bg-transparent">
          <TableHead className="w-28">Date</TableHead>
          <TableHead className="w-40">File</TableHead>
          <TableHead className="w-36">Result</TableHead>
          <TableHead className="hidden w-14 text-right md:table-cell">Total</TableHead>
          <TableHead className="hidden w-14 text-right md:table-cell">New</TableHead>
          <TableHead className="w-14">Dup</TableHead>
          <TableHead className="w-20 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell className="w-28">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </TableCell>
            <TableCell className="w-40">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </TableCell>
            <TableCell className="w-36">
              <div className="h-5 w-16 rounded bg-muted animate-pulse" />
            </TableCell>
            <TableCell className="hidden w-14 text-right md:table-cell">
              <div className="ml-auto h-4 w-8 rounded bg-muted animate-pulse" />
            </TableCell>
            <TableCell className="hidden w-14 text-right md:table-cell">
              <div className="ml-auto h-4 w-8 rounded bg-muted animate-pulse" />
            </TableCell>
            <TableCell className="w-14">
              <div className="h-4 w-6 rounded bg-muted animate-pulse" />
            </TableCell>
            <TableCell className="w-20 text-right">
              <div className="ml-auto h-8 w-14 rounded bg-muted animate-pulse" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
