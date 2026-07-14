import { and, eq } from 'drizzle-orm'
import { isInvoiceClosed, sumAmounts, toNumber } from '@pmf/core'
import type {
  RegisterInvoicePaymentInput,
  UnregisterInvoicePaymentInput,
  UpdateInvoicePaymentInput,
} from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { invoicePayments, invoices, transactions } from '../db/schema'

type InvoiceRow = typeof invoices.$inferSelect
type PaymentRow = typeof invoicePayments.$inferSelect

/** Recalcula amountPaid/status da fatura a partir das parcelas pagas atuais (após a mutação). */
async function recalcInvoiceAggregates(
  tx: DrizzleDB,
  invoice: InvoiceRow,
  payments: PaymentRow[],
) {
  const amountPaid = sumAmounts(payments.map((p) => p.amount))
  const closed = isInvoiceClosed(
    {
      amountPerInstallment: toNumber(invoice.amountPerInstallment),
      totalInstallments: invoice.totalInstallments,
      firstDueDate: invoice.firstDueDate,
    },
    payments.map((p) => ({
      id: p.id,
      installmentNumber: p.installmentNumber,
      amount: toNumber(p.amount),
      paidOn: p.paidOn,
    })),
  )
  await tx
    .update(invoices)
    .set({ amountPaid: amountPaid.toFixed(2), status: closed ? ('pago' as const) : ('pendente' as const) })
    .where(eq(invoices.id, invoice.id))
}

async function findInvoicePayments(db: DrizzleDB, userId: string, invoiceId: string) {
  return db
    .select()
    .from(invoicePayments)
    .where(and(eq(invoicePayments.invoiceId, invoiceId), eq(invoicePayments.userId, userId)))
}

/**
 * Registra o pagamento de uma parcela de fatura: cria a despesa automática (categoria/cartão
 * herdados da fatura, source 'invoice') + a linha em invoice_payments, e recalcula os
 * agregados da fatura, tudo na mesma transação de banco (espelha registerChargePayment).
 */
export async function registerInvoicePayment(
  db: DrizzleDB,
  userId: string,
  input: RegisterInvoicePaymentInput,
) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, input.id), eq(invoices.userId, userId)))
  if (!invoice) return null

  if (input.installmentNumber < 1 || input.installmentNumber > invoice.totalInstallments)
    return 'invalid_installment' as const

  const existing = await findInvoicePayments(db, userId, invoice.id)
  if (existing.some((p) => p.installmentNumber === input.installmentNumber))
    return 'conflict' as const

  return db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'despesa',
        value: input.amount.toFixed(2),
        description: `${invoice.description || invoice.cardName} — parcela ${input.installmentNumber}/${invoice.totalInstallments}`,
        categoryId: invoice.categoryId,
        cardId: invoice.cardId,
        source: 'invoice',
        date: input.paidOn,
      })
      .returning()

    const [payment] = await tx
      .insert(invoicePayments)
      .values({
        userId,
        invoiceId: invoice.id,
        installmentNumber: input.installmentNumber,
        amount: input.amount.toFixed(2),
        paidOn: input.paidOn,
        transactionId: transaction!.id,
      })
      .returning()

    await recalcInvoiceAggregates(tx, invoice, [...existing, payment!])

    return { payment: payment!, transaction: transaction! }
  })
}

/** Atualiza valor/data de um pagamento já registrado e propaga para a despesa vinculada. */
export async function updateInvoicePayment(
  db: DrizzleDB,
  userId: string,
  input: UpdateInvoicePaymentInput,
) {
  const [payment] = await db
    .select()
    .from(invoicePayments)
    .where(and(eq(invoicePayments.id, input.paymentId), eq(invoicePayments.userId, userId)))
  if (!payment) return null

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, payment.invoiceId), eq(invoices.userId, userId)))
  if (!invoice) return null

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(invoicePayments)
      .set({ amount: input.amount.toFixed(2), paidOn: input.paidOn })
      .where(eq(invoicePayments.id, payment.id))
      .returning()

    if (payment.transactionId) {
      await tx
        .update(transactions)
        .set({ value: input.amount.toFixed(2), date: input.paidOn })
        .where(and(eq(transactions.id, payment.transactionId), eq(transactions.userId, userId)))
    }

    const all = await findInvoicePayments(tx, userId, invoice.id)
    await recalcInvoiceAggregates(tx, invoice, all)

    return updated!
  })
}

/** Desfaz o pagamento de uma parcela: apaga o registro + a despesa vinculada e recalcula agregados. */
export async function unregisterInvoicePayment(
  db: DrizzleDB,
  userId: string,
  input: UnregisterInvoicePaymentInput,
) {
  const [payment] = await db
    .select()
    .from(invoicePayments)
    .where(and(eq(invoicePayments.id, input.paymentId), eq(invoicePayments.userId, userId)))
  if (!payment) return null

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, payment.invoiceId), eq(invoices.userId, userId)))
  if (!invoice) return null

  return db.transaction(async (tx) => {
    await tx.delete(invoicePayments).where(eq(invoicePayments.id, payment.id))
    if (payment.transactionId) {
      await tx
        .delete(transactions)
        .where(and(eq(transactions.id, payment.transactionId), eq(transactions.userId, userId)))
    }

    const remaining = await findInvoicePayments(tx, userId, invoice.id)
    await recalcInvoiceAggregates(tx, invoice, remaining)

    return { id: payment.id }
  })
}
