ALTER TYPE "public"."tx_source" ADD VALUE 'invoice';--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"invoice_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paid_on" date NOT NULL,
	"transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_payment_installment_unique" UNIQUE("invoice_id","installment_number"),
	CONSTRAINT "invoice_payment_installment_min" CHECK ("invoice_payments"."installment_number" >= 1)
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "first_due_date" date;--> statement-breakpoint
UPDATE "invoices" SET "first_due_date" = COALESCE("due_date", "created_at"::date);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "first_due_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "due_date";