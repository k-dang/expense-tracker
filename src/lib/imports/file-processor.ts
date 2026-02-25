import type {
  ProcessImportFileInput,
  ProcessImportFileResult,
} from "@/lib/imports/process-import-file";

export type FileProcessorMetadata = {
  id: string;
  label: string;
  description: string;
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
};

export type FileProcessor = {
  metadata: FileProcessorMetadata;
  process(input: ProcessImportFileInput): ProcessImportFileResult;
};

export function getAcceptString(metadata: FileProcessorMetadata): string {
  return [...metadata.acceptedExtensions, ...metadata.acceptedMimeTypes].join(
    ",",
  );
}
