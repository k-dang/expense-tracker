import { listImports } from "@/db/queries/imports";
import { DeleteImportDialog } from "@/components/imports/delete-import-dialog";
import { ViewDuplicatesDialog } from "@/components/imports/view-duplicates-dialog";
import { formatUtcTimestamp } from "@/lib/date/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function ImportHistoryTable() {
  const imports = await listImports();

  if (imports.length === 0) {
    return <p className="text-sm text-muted-foreground">No imports yet.</p>;
  }

  return (
    <Table className="min-w-[700px]">
      <TableHeader>
        <TableRow className="text-muted-foreground hover:bg-transparent">
          <TableHead>Uploaded</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Inserted</TableHead>
          <TableHead>Duplicates</TableHead>
          <TableHead>Error</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {imports.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatUtcTimestamp(item.uploadedAt)}</TableCell>
            <TableCell>{item.filename}</TableCell>
            <TableCell>{item.status}</TableCell>
            <TableCell>{item.rowCountTotal}</TableCell>
            <TableCell>{item.rowCountInserted}</TableCell>
            <TableCell>
              <ViewDuplicatesDialog
                importId={item.id}
                duplicateCount={item.rowCountDuplicates}
              />
            </TableCell>
            <TableCell>{item.errorMessage ?? "-"}</TableCell>
            <TableCell className="text-right">
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
    <Table className="min-w-[700px]">
      <TableHeader>
        <TableRow className="text-muted-foreground hover:bg-transparent">
          <TableHead>Uploaded</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Inserted</TableHead>
          <TableHead>Duplicates</TableHead>
          <TableHead>Error</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 8 }).map((_, j) => (
              <TableCell key={j}>
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
