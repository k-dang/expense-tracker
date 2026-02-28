CREATE TABLE `portfolio_import_files` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`as_of_date` text NOT NULL,
	`filename` text NOT NULL,
	`row_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`error_message` text,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_import_files_portfolio_date_filename_unique` ON `portfolio_import_files` (`portfolio_id`,`as_of_date`,`filename`);
--> statement-breakpoint
CREATE INDEX `portfolio_import_files_portfolio_date_idx` ON `portfolio_import_files` (`portfolio_id`,`as_of_date`);
