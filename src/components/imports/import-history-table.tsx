import { listImports } from "@/db/queries/imports";
import { DeleteImportDialog } from "@/components/imports/delete-import-dialog";
import { ViewDuplicatesDialog } from "@/components/imports/view-duplicates-dialog";
import { formatUtcTimestamp } from "@/lib/date/utils";

export async function ImportHistoryTable() {
  const imports = await listImports();

  if (imports.length === 0) {
    return <p className="text-sm text-muted-foreground">No imports yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-left">
            <th className="py-2 pr-3">Uploaded</th>
            <th className="py-2 pr-3">File</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Total</th>
            <th className="py-2 pr-3">Inserted</th>
            <th className="py-2 pr-3">Duplicates</th>
            <th className="py-2 pr-3">Error</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {imports.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2 pr-3">
                {formatUtcTimestamp(item.uploadedAt)}
              </td>
              <td className="py-2 pr-3">{item.filename}</td>
              <td className="py-2 pr-3">{item.status}</td>
              <td className="py-2 pr-3">{item.rowCountTotal}</td>
              <td className="py-2 pr-3">{item.rowCountInserted}</td>
              <td className="py-2 pr-3">
                <ViewDuplicatesDialog
                  importId={item.id}
                  duplicateCount={item.rowCountDuplicates}
                />
              </td>
              <td className="py-2 pr-3">{item.errorMessage ?? "-"}</td>
              <td className="py-2 text-right">
                <DeleteImportDialog importId={item.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
