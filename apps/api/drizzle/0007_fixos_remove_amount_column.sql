ALTER TABLE "fixed_expenses" DROP CONSTRAINT "fe_amount_positive";--> statement-breakpoint
ALTER TABLE "fixed_expenses" ALTER COLUMN "effective_from" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fixed_expenses" DROP COLUMN "amount";