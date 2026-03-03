import {
  getOrCreateDefaultPortfolio,
  listPortfolioImportDates,
} from "@/db/queries/portfolio";
import { DeletePortfolioSnapshotDialog } from "@/components/portfolio/delete-portfolio-snapshot-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortfolioImportHistoryCollapsible } from "@/components/portfolio/portfolio-import-history-collapsible";

export async function PortfolioImportHistory() {
  const portfolio = await getOrCreateDefaultPortfolio();
  const importDates = await listPortfolioImportDates(portfolio.id);

  if (importDates.length === 0) {
    return null;
  }

  return (
    <PortfolioImportHistoryCollapsible count={importDates.length}>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="text-muted-foreground hover:bg-transparent">
            <TableHead className="w-32">Date</TableHead>
            <TableHead className="w-20 text-right">Files</TableHead>
            <TableHead className="w-20 text-right">Rows</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {importDates.map((item) => (
            <TableRow key={item.asOfDate}>
              <TableCell className="tabular-nums">{item.asOfDate}</TableCell>
              <TableCell className="text-right tabular-nums">
                {item.fileCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.totalRows}
              </TableCell>
              <TableCell className="text-right">
                <DeletePortfolioSnapshotDialog asOfDate={item.asOfDate} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PortfolioImportHistoryCollapsible>
  );
}
