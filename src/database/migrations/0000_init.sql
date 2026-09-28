CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`currency_code` text DEFAULT 'UZS' NOT NULL,
	`initial_balance_minor` integer DEFAULT 0 NOT NULL,
	`color` text,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "accounts_kind_check" CHECK("accounts"."kind" IN ('card', 'cash', 'other'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_name_unique` ON `accounts` ("name" COLLATE NOCASE) WHERE "accounts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text,
	`system_key` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "categories_kind_check" CHECK("categories"."kind" IN ('expense', 'income'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_system_key_unique` ON `categories` (`system_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_kind_name_unique` ON `categories` (`kind`,"name" COLLATE NOCASE) WHERE "categories"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_categories` (
	`transaction_id` text NOT NULL,
	`category_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`transaction_id`, `category_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `transaction_categories_category_idx` ON `transaction_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`account_id` text NOT NULL,
	`to_account_id` text,
	`amount_minor` integer NOT NULL,
	`note` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "transactions_type_check" CHECK("transactions"."type" IN ('expense', 'income', 'transfer')),
	CONSTRAINT "transactions_amount_check" CHECK("transactions"."amount_minor" > 0),
	CONSTRAINT "transactions_transfer_check" CHECK(("transactions"."type" = 'transfer' AND "transactions"."to_account_id" IS NOT NULL AND "transactions"."to_account_id" <> "transactions"."account_id")
        OR ("transactions"."type" <> 'transfer' AND "transactions"."to_account_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `transactions_occurred_idx` ON `transactions` (`occurred_at`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`,`occurred_at`) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `transactions_to_account_idx` ON `transactions` (`to_account_id`) WHERE "transactions"."to_account_id" IS NOT NULL AND "transactions"."deleted_at" IS NULL;