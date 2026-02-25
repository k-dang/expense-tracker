import type { FileProcessor } from "@/lib/imports/file-processor";
import { genericCsvProcessor } from "@/lib/imports/processors/generic-csv";

export const DEFAULT_PROCESSOR_ID = "generic-csv";

const processors: Record<string, FileProcessor> = {
  "generic-csv": genericCsvProcessor,
};

export function getProcessor(id: string): FileProcessor | undefined {
  return processors[id];
}

export function listProcessors(): FileProcessor[] {
  return Object.values(processors);
}
