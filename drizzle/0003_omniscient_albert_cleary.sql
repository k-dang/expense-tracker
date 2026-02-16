CREATE TABLE `category_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`description_pattern` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_rules_description_pattern_unique` ON `category_rules` (`description_pattern`);--> statement-breakpoint
DROP INDEX `import_duplicates_import_id_idx`;--> statement-breakpoint
DROP INDEX `transactions_txn_date_idx`;--> statement-breakpoint
DROP INDEX `transactions_category_idx`;--> statement-breakpoint
DROP INDEX `transactions_vendor_idx`;--> statement-breakpoint
DROP INDEX `transactions_import_id_idx`;