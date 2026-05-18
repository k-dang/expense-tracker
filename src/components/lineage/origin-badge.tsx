"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatUtcTimestampShort } from "@/lib/date/utils";
import { formatFileSizeBytes, shortSha256Preview } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ImportRow } from "@/db/schema";
import { Info } from "lucide-react";

export type TxnOriginBadgeProps = {
  createdAt: number;
  importId: string | null;
  sourceRowNumber: number | null;
  importFilename: string | null;
  importUploadedAt: number | null;
  importProcessorLabel: string | null;
  importProcessorId: string | null;
  importContentType: string | null;
  importFileSizeBytes: number | null;
  importFileSha256: string | null;
  className?: string;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 break-all font-medium">{value}</span>
    </div>
  );
}

export function TxnOriginBadge(props: TxnOriginBadgeProps) {
  const isManual = props.importId == null;
  const label = isManual ? "Manual" : "Imported";

  return (
    <Popover>
      <PopoverTrigger
        className={cn("inline-flex shrink-0", props.className)}
        render={
          <Button variant="outline" size="sm" className="h-6 px-1.5 text-xs" />
        }
      >
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-3">
        {isManual ? (
          <>
            <PopoverHeader>
              <PopoverTitle>Manual</PopoverTitle>
            </PopoverHeader>
            <div className="flex flex-col gap-2">
              <DetailRow
                label="Entered"
                value={formatUtcTimestampShort(props.createdAt)}
              />
            </div>
          </>
        ) : (
          <>
            <PopoverHeader>
              <PopoverTitle>Imported</PopoverTitle>
            </PopoverHeader>
            <div className="flex flex-col gap-2">
              {props.importFilename ? (
                <DetailRow label="File" value={props.importFilename} />
              ) : null}
              <DetailRow
                label="Uploaded"
                value={formatUtcTimestampShort(
                  props.importUploadedAt ?? props.createdAt,
                )}
              />
              <DetailRow
                label="Processor"
                value={
                  props.importProcessorLabel ??
                  props.importProcessorId ??
                  "Unknown processor"
                }
              />
              {props.importProcessorId &&
              props.importProcessorLabel !== props.importProcessorId ? (
                <DetailRow
                  label="Processor id"
                  value={props.importProcessorId}
                />
              ) : null}
              {props.importContentType ? (
                <DetailRow label="MIME type" value={props.importContentType} />
              ) : null}
              {props.importFileSizeBytes != null ? (
                <DetailRow
                  label="File size"
                  value={formatFileSizeBytes(props.importFileSizeBytes)}
                />
              ) : null}
              {props.importFileSha256 ? (
                <DetailRow
                  label="File SHA-256"
                  value={
                    <span className="font-mono" title={props.importFileSha256}>
                      {shortSha256Preview(props.importFileSha256)}
                    </span>
                  }
                />
              ) : null}
              {props.sourceRowNumber != null ? (
                <DetailRow
                  label="CSV row"
                  value={String(props.sourceRowNumber)}
                />
              ) : null}
              <DetailRow
                label="Recorded"
                value={formatUtcTimestampShort(props.createdAt)}
              />
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function ImportBatchDetailsTrigger({ batch }: { batch: ImportRow }) {
  const processorLabel =
    batch.processorLabel ?? batch.processorId ?? "Unknown processor";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground"
            aria-label="Import provenance details"
          />
        }
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-3">
        <PopoverHeader>
          <PopoverTitle
            className="max-w-[16rem] truncate"
            title={batch.filename}
          >
            {batch.filename}
          </PopoverTitle>
          <PopoverDescription>Import metadata</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-2">
          <DetailRow
            label="Kind"
            value={batch.type === "income" ? "Income" : "Expense"}
          />
          <DetailRow
            label="Uploaded"
            value={formatUtcTimestampShort(batch.uploadedAt)}
          />
          <DetailRow label="Processor" value={processorLabel} />
          {batch.processorId && batch.processorLabel !== batch.processorId ? (
            <DetailRow label="Processor id" value={batch.processorId} />
          ) : null}
          {batch.contentType ? (
            <DetailRow label="MIME type" value={batch.contentType} />
          ) : null}
          {batch.fileSizeBytes != null ? (
            <DetailRow
              label="File size"
              value={formatFileSizeBytes(batch.fileSizeBytes)}
            />
          ) : null}
          {batch.fileSha256 ? (
            <DetailRow
              label="File SHA-256"
              value={
                <span className="font-mono" title={batch.fileSha256}>
                  {shortSha256Preview(batch.fileSha256)}
                </span>
              }
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
