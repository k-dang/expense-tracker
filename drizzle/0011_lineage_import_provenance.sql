ALTER TABLE `imports` ADD `processor_id` text;--> statement-breakpoint
ALTER TABLE `imports` ADD `processor_label` text;--> statement-breakpoint
ALTER TABLE `imports` ADD `content_type` text;--> statement-breakpoint
ALTER TABLE `imports` ADD `file_size_bytes` integer;--> statement-breakpoint
ALTER TABLE `imports` ADD `file_sha256` text;--> statement-breakpoint
ALTER TABLE `expenses` ADD `source_row_number` integer;--> statement-breakpoint
ALTER TABLE `incomes` ADD `source_row_number` integer;--> statement-breakpoint
ALTER TABLE `import_duplicates` ADD `source_row_number` integer;
