-- Limpeza de dados órfãos (fase 8: card_id de faturas vira obrigatório).
-- Todos os dados hoje são de teste (confirmado pelo product owner). Escopo estrito:
-- só faturas com card_id IS NULL e o que está em cascata a partir delas.
-- 1) Apaga as despesas geradas por pagamentos de faturas órfãs, via subquery em invoice_payments.
DELETE FROM "transactions"
WHERE "id" IN (
	SELECT "transaction_id" FROM "invoice_payments"
	WHERE "transaction_id" IS NOT NULL
	  AND "invoice_id" IN (SELECT "id" FROM "invoices" WHERE "card_id" IS NULL)
);
--> statement-breakpoint
-- 2) Apaga as faturas órfãs; ON DELETE CASCADE de invoice_payments.invoice_id → invoices.id
--    cuida de apagar os pagamentos associados.
DELETE FROM "invoices" WHERE "card_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_card_id_cards_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "card_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;