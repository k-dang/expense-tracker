CREATE TABLE `incomes` (
	`id` text PRIMARY KEY NOT NULL,
	`income_date` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`source` text DEFAULT 'Other' NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`fingerprint` text NOT NULL,
	`import_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `incomes_fingerprint_unique` ON `incomes` (`fingerprint`);--> statement-breakpoint
ALTER TABLE `import_duplicates` ADD `type` text DEFAULT 'transaction' NOT NULL;--> statement-breakpoint
ALTER TABLE `imports` ADD `type` text DEFAULT 'transaction' NOT NULL;