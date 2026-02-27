CREATE TABLE `portfolio_snapshot_positions` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`security_id` text NOT NULL,
	`shares_micros` integer NOT NULL,
	`market_value_cents` integer NOT NULL,
	`weight_bps` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `portfolio_snapshots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`security_id`) REFERENCES `securities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_snapshot_positions_snapshot_security_unique` ON `portfolio_snapshot_positions` (`snapshot_id`,`security_id`);--> statement-breakpoint
CREATE INDEX `portfolio_snapshot_positions_snapshot_weight_idx` ON `portfolio_snapshot_positions` (`snapshot_id`,`weight_bps`);--> statement-breakpoint
CREATE TABLE `portfolio_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`as_of_date` text NOT NULL,
	`total_market_value_cents` integer NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `portfolio_snapshots_portfolio_as_of_idx` ON `portfolio_snapshots` (`portfolio_id`,`as_of_date`);--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`base_currency` text DEFAULT 'CAD' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `securities` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`company_name` text NOT NULL,
	`exchange` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`logo_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `securities_symbol_unique` ON `securities` (`symbol`);