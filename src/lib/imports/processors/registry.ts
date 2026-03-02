import type { FileProcessor } from "@/lib/imports/file-processor";
import { amexPdfProcessor } from "@/lib/imports/processors/amex-pdf";
import { genericCsvProcessor } from "@/lib/imports/processors/generic-csv";
import { rogersCsvProcessor } from "@/lib/imports/processors/rogers-csv";
import { wealthsimpleCsvProcessor } from "@/lib/imports/processors/wealthsimple-csv";

export const DEFAULT_PROCESSOR_ID = "generic-csv";

const processors: Record<string, FileProcessor> = {
  "amex-pdf": amexPdfProcessor,
  "generic-csv": genericCsvProcessor,
  "rogers-csv": rogersCsvProcessor,
  "wealthsimple-csv": wealthsimpleCsvProcessor,
};

export function getProcessor(id: string): FileProcessor | undefined {
  return processors[id];
}

export function listProcessors(): FileProcessor[] {
  return Object.values(processors);
}
