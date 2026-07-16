CREATE TABLE "fixed_expense_amount_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"fixed_expense_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feah_amount_positive" CHECK ("fixed_expense_amount_history"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "fixed_expenses" ADD COLUMN "effective_from" date;--> statement-breakpoint
ALTER TABLE "fixed_expenses" ADD COLUMN "effective_until" date;--> statement-breakpoint
ALTER TABLE "fixed_expense_amount_history" ADD CONSTRAINT "fixed_expense_amount_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_expense_amount_history" ADD CONSTRAINT "fixed_expense_amount_history_fixed_expense_id_fixed_expenses_id_fk" FOREIGN KEY ("fixed_expense_id") REFERENCES "public"."fixed_expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feah_expense_month_unique" ON "fixed_expense_amount_history" USING btree ("fixed_expense_id","effective_from");--> statement-breakpoint
-- Backfill (2026-07-16): fixos existentes passam a valer "desde sempre" (sentinela),
-- preservando o comportamento atual até o usuário editar/reajustar cada um.
UPDATE "fixed_expenses" SET "effective_from" = '1970-01-01' WHERE "effective_from" IS NULL;--> statement-breakpoint
ALTER TABLE "fixed_expenses" ALTER COLUMN "effective_from" SET NOT NULL;--> statement-breakpoint
INSERT INTO "fixed_expense_amount_history" ("user_id", "fixed_expense_id", "amount", "effective_from")
SELECT "user_id", "id", "amount", "effective_from" FROM "fixed_expenses";