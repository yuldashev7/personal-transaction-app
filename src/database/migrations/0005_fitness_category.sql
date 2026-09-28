-- "Fitnes" is inserted by the seed at position 13; built-ins after it shift by one so "Boshqa"
-- stays last. Order matches DEFAULT_CATEGORIES in seed.ts.
UPDATE `categories`
SET `sort_order` = CASE `system_key`
		WHEN 'expense_other' THEN 14
		WHEN 'salary' THEN 15
		WHEN 'freelance' THEN 16
		WHEN 'gift' THEN 17
		WHEN 'income_other' THEN 18
	END
WHERE `system_key` IN ('expense_other', 'salary', 'freelance', 'gift', 'income_other');
