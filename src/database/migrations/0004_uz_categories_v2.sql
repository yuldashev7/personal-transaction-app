-- Default expense categories v2. New defaults (Avtobus, Marshrutka, Korzinka, …) are inserted by
-- the seed after migrations. Only built-in rows still carrying their default name are touched, so
-- anything the user renamed is left alone. No transaction history is removed.

-- "Suv" becomes "Ichimlik" in place, keeping its transactions. OR IGNORE skips it if the user
-- already has an "Ichimlik" category.
UPDATE OR IGNORE `categories`
SET `system_key` = 'drinks', `name` = 'Ichimlik', `icon` = 'drinks',
	`updated_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE `system_key` = 'water' AND `name` = 'Suv' AND `deleted_at` IS NULL;
--> statement-breakpoint
-- Retired defaults that were used are archived: hidden from pickers, restorable, history intact.
UPDATE `categories`
SET `archived_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000,
	`updated_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE `deleted_at` IS NULL AND `archived_at` IS NULL
	AND (`system_key`, `name`) IN (
		VALUES ('water', 'Suv'), ('coffee', 'Qahva'), ('home', 'Uy'), ('entertainment', 'Koʻngilochar')
	)
	AND EXISTS (
		SELECT 1 FROM `transaction_categories` WHERE `category_id` = `categories`.`id`
	);
--> statement-breakpoint
-- Retired defaults that were never used are removed (soft delete).
UPDATE `categories`
SET `deleted_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000,
	`updated_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE `deleted_at` IS NULL AND `archived_at` IS NULL
	AND (`system_key`, `name`) IN (
		VALUES ('water', 'Suv'), ('coffee', 'Qahva'), ('home', 'Uy'), ('entertainment', 'Koʻngilochar')
	)
	AND NOT EXISTS (
		SELECT 1 FROM `transaction_categories` WHERE `category_id` = `categories`.`id`
	);
--> statement-breakpoint
-- Built-in order matches DEFAULT_CATEGORIES in seed.ts.
UPDATE `categories`
SET `sort_order` = CASE `system_key`
		WHEN 'food' THEN 0
		WHEN 'drinks' THEN 1
		WHEN 'taxi' THEN 2
		WHEN 'metro' THEN 5
		WHEN 'shopping' THEN 9
		WHEN 'pharmacy' THEN 10
		WHEN 'expense_other' THEN 13
		WHEN 'salary' THEN 14
		WHEN 'freelance' THEN 15
		WHEN 'gift' THEN 16
		WHEN 'income_other' THEN 17
	END
WHERE `system_key` IN (
	'food', 'drinks', 'taxi', 'metro', 'shopping', 'pharmacy', 'expense_other',
	'salary', 'freelance', 'gift', 'income_other'
);
