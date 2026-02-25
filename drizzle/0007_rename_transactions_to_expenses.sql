-- Rename transactions table to expenses
DROP INDEX IF EXISTS `transactions_fingerprint_unique`;
--> statement-breakpoint
ALTER TABLE `transactions` RENAME TO `expenses`;
--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_fingerprint_unique` ON `expenses` (`fingerprint`);
--> statement-breakpoint
-- Update enum values in imports and import_duplicates
UPDATE `imports` SET `type` = 'expense' WHERE `type` = 'transaction';
--> statement-breakpoint
UPDATE `import_duplicates` SET `type` = 'expense' WHERE `type` = 'transaction';
