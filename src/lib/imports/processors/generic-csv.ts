import type { FileProcessor } from "@/lib/imports/file-processor";
import { processImportFileInput } from "@/lib/imports/process-import-file";

export const genericCsvProcessor: FileProcessor = {
  metadata: {
    id: "generic-csv",
    label: "Generic CSV",
    description:
      "CSV with exact headers: date,description,amount,category (date in MM-DD-YYYY)",
    acceptedExtensions: [".csv"],
    acceptedMimeTypes: ["text/csv", "application/vnd.ms-excel"],
  },
  process: processImportFileInput,
};
