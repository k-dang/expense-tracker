CREATE TABLE `imports` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	`row_count_total` integer NOT NULL,
	`row_count_inserted` integer NOT NULL,
	`row_count_duplicates` integer NOT NULL,
	`status` text NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`txn_date` text NOT NULL,
	`vendor` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`category` text NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`fingerprint` text NOT NULL,
	`import_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_fingerprint_unique` ON `transactions` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `transactions_txn_date_idx` ON `transactions` (`txn_date`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category`);--> statement-breakpoint
CREATE INDEX `transactions_vendor_idx` ON `transactions` (`vendor`);--> statement-breakpoint
CREATE INDEX `transactions_import_id_idx` ON `transactions` (`import_id`);