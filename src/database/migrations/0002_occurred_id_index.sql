DROP INDEX `transactions_occurred_idx`;--> statement-breakpoint
CREATE INDEX `transactions_occurred_id_idx` ON `transactions` (`occurred_at`,`id`) WHERE "transactions"."deleted_at" IS NULL;