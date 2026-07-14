import { and, desc, eq } from 'drizzle-orm'
import { applyChargePayment, revertChargePayment, toNumber } from '@pmf/core'
import type { RegisterChargePaymentInput, UnregisterChargePaymentInput } from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { chargePayments, charges, transactions } from '../db/schema'
import { getOrCreateSystemCategory } from './categories'

export const CHARGE_CATEGORY_NAME = 'Cobrança'

export async function listChargePayments(db: DrizzleDB, userId: string, chargeId: string) {
  return db
    .select()
    .from(chargePayments)
    .where(and(eq(chargePayments.userId, userId), eq(chargePayments.chargeId, chargeId)))
    .orderBy(desc(chargePayments.createdAt))
}

/**
 * Registra um recebimento parcial (fase 8.1): soma ao amountPaid e cria, na mesma
 * transação de banco, a receita (source 'charge', categoria de sistema "Cobrança")
 * + o histórico em charge_payments. Espelha payFixedExpense.
 */
export async function registerChargePayment(
  db: DrizzleDB,
  userId: string,
  input: RegisterChargePaymentInput,
) {
  const [charge] = await db
    .select()
    .from(charges)
    .where(and(eq(charges.id, input.id), eq(charges.userId, userId)))
  if (!charge) return null

  const applied = applyChargePayment(
    toNumber(charge.amountPerInstallment),
    charge.totalInstallments,
    toNumber(charge.amountPaid),
    input.amount,
  )
  if (!applied) return 'exceeds_total' as const

  const category = await getOrCreateSystemCategory(db, userId, CHARGE_CATEGORY_NAME, 'receita')

  return db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'receita',
        value: input.amount.toFixed(2),
        description: `Recebimento de ${charge.debtorName}`,
        categoryId: category.id,
        source: 'charge',
        date: new Date().toISOString().slice(0, 10),
      })
      .returning()

    const [payment] = await tx
      .insert(chargePayments)
      .values({
        userId,
        chargeId: charge.id,
        amount: input.amount.toFixed(2),
        transactionId: transaction!.id,
      })
      .returning()

    await tx
      .update(charges)
      .set({
        amountPaid: applied.newAmountPaid.toFixed(2),
        ...(applied.fullyPaid ? { status: 'pago' as const } : {}),
      })
      .where(eq(charges.id, charge.id))

    return payment
  })
}

/**
 * Desfaz um recebimento: remove payment + receita vinculada e recompõe o amountPaid,
 * tudo na mesma transação de banco (espelha unpayFixedExpense).
 */
export async function unregisterChargePayment(
  db: DrizzleDB,
  userId: string,
  input: UnregisterChargePaymentInput,
) {
  const [payment] = await db
    .select()
    .from(chargePayments)
    .where(and(eq(chargePayments.id, input.paymentId), eq(chargePayments.userId, userId)))
  if (!payment) return null

  const [charge] = await db
    .select()
    .from(charges)
    .where(and(eq(charges.id, payment.chargeId), eq(charges.userId, userId)))
  if (!charge) return null

  const newAmountPaid = revertChargePayment(toNumber(charge.amountPaid), toNumber(payment.amount))

  return db.transaction(async (tx) => {
    await tx.delete(chargePayments).where(eq(chargePayments.id, payment.id))
    if (payment.transactionId) {
      await tx
        .delete(transactions)
        .where(and(eq(transactions.id, payment.transactionId), eq(transactions.userId, userId)))
    }
    await tx
      .update(charges)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        ...(charge.status === 'pago' ? { status: 'pendente' as const } : {}),
      })
      .where(eq(charges.id, charge.id))
    return { id: payment.id }
  })
}
