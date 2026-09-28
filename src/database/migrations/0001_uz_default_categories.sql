-- Renames built-in categories to Uzbek. Only rows still carrying their original English name are
-- touched, and OR IGNORE skips any row whose new name would clash with a user's own category.
UPDATE OR IGNORE `categories`
SET
	`name` = CASE `system_key`
		WHEN 'food' THEN 'Oziq-ovqat'
		WHEN 'water' THEN 'Suv'
		WHEN 'taxi' THEN 'Taksi'
		WHEN 'metro' THEN 'Metro'
		WHEN 'shopping' THEN 'Xaridlar'
		WHEN 'coffee' THEN 'Qahva'
		WHEN 'pharmacy' THEN 'Dorixona'
		WHEN 'home' THEN 'Uy'
		WHEN 'entertainment' THEN 'Koʻngilochar'
		WHEN 'expense_other' THEN 'Boshqa'
		WHEN 'salary' THEN 'Maosh'
		WHEN 'freelance' THEN 'Frilans'
		WHEN 'gift' THEN 'Sovgʻa'
		WHEN 'income_other' THEN 'Boshqa'
	END,
	`updated_at` = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE (`system_key`, `name`) IN (
	VALUES
		('food', 'Food'),
		('water', 'Water'),
		('taxi', 'Taxi'),
		('metro', 'Metro'),
		('shopping', 'Shopping'),
		('coffee', 'Coffee'),
		('pharmacy', 'Pharmacy'),
		('home', 'Home'),
		('entertainment', 'Entertainment'),
		('expense_other', 'Other'),
		('salary', 'Salary'),
		('freelance', 'Freelance'),
		('gift', 'Gift'),
		('income_other', 'Other')
);
