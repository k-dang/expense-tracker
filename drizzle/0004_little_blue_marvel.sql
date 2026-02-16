PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`txn_date` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`category` text NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`fingerprint` text NOT NULL,
	`import_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "txn_date", "description", "amount_cents", "category", "currency", "fingerprint", "import_id", "created_at") SELECT "id", "txn_date", "description", "amount_cents", "category", "currency", "fingerprint", "import_id", "created_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_fingerprint_unique` ON `transactions` (`fingerprint`);