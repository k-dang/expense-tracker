CREATE TABLE `import_duplicates` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`txn_date` text NOT NULL,
	`vendor` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`category` text NOT NULL,
	`currency` text DEFAULT 'CAD' NOT NULL,
	`fingerprint` text NOT NULL,
	`reason` text NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `import_duplicates_import_id_idx` ON `import_duplicates` (`import_id`);
