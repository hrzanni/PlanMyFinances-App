import { and, asc, eq } from 'drizzle-orm'
import { effectiveDueDate, fixedExpenseStatus, fixedExpenseTotals } from '@pmf/core'
import type {
  CreateFixedExpenseInput,
  PayFixedExpenseInput,
  UnpayFixedExpenseInput,
  UpdateFixedExpenseInput,
} from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { fixedExpensePayments, fixedExpenses, transactions } from '../db/schema'

function refMonth(month: string): string {
  return `${month}-01`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Lista os gastos ativos com o pagamento do mês e o status derivado (FR-101/102). */
export async function listFixedExpenses(db: DrizzleDB, userId: string, month: string) {
  const reference = refMonth(month)
  const today = todayIso()

  const expenses = await db
    .select()
    .from(fixedExpenses)
    .where(and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.status, 'active')))
    .orderBy(asc(fixedExpenses.dueDay), asc(fixedExpenses.name))

  const payments = await db
    .select()
    .from(fixedExpensePayments)
    .where(
      and(
        eq(fixedExpensePayments.userId, userId),
        eq(fixedExpensePayments.referenceMonth, reference),
      ),
    )

  const items = expenses.map((expense) => {
    const payment = payments.find((p) => p.fixedExpenseId === expense.id) ?? null
    return {
      ...expense,
      payment,
      monthlyStatus: fixedExpenseStatus({
        dueDay: expense.dueDay,
        month: reference,
        today,
        paidAt: payment?.paidAt ?? null,
      }),
    }
  })

  const totals = fixedExpenseTotals(
    items.map((i) => ({ amount: i.amount, paidAmount: i.payment?.amount ?? null })),
  )

  return { items, totals }
}

export async function createFixedExpense(
  db: DrizzleDB,
  userId: string,
  input: CreateFixedExpenseInput,
) {
  const [row] = await db
    .insert(fixedExpenses)
    .values({ userId, ...input, amount: input.amount.toFixed(2) })
    .returning()
  return row
}

/** Editar valor vale do mês vigente em diante; pagamentos guardam snapshot (FR-105). */
export async function updateFixedExpense(
  db: DrizzleDB,
  userId: string,
  input: UpdateFixedExpenseInput,
) {
  const { id, amount, ...rest } = input
  const [row] = await db
    .update(fixedExpenses)
    .set({ ...rest, ...(amount != null ? { amount: amount.toFixed(2) } : {}) })
    .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
    .returning()
  return row ?? null
}

export async function deleteFixedExpense(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(fixedExpenses)
    .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
    .returning({ id: fixedExpenses.id })
  return row ?? null
}

/**
 * Marca como pago no mês (FR-103): grava payment com snapshot do valor vigente e
 * cria a transação de despesa vinculada, tudo na mesma transação de banco.
 * Pagar duas vezes o mesmo mês é no-op (UNIQUE fixed_expense_id+reference_month).
 */
export async function payFixedExpense(db: DrizzleDB, userId: string, input: PayFixedExpenseInput) {
  const reference = refMonth(input.month)

  const [expense] = await db
    .select()
    .from(fixedExpenses)
    .where(and(eq(fixedExpenses.id, input.id), eq(fixedExpenses.userId, userId)))
  if (!expense) return null

  const [existing] = await db
    .select()
    .from(fixedExpensePayments)
    .where(
      and(
        eq(fixedExpensePayments.fixedExpenseId, expense.id),
        eq(fixedExpensePayments.referenceMonth, reference),
      ),
    )
  if (existing) return existing

  const today = todayIso()
  const paidAt = input.paidAt ?? (today.slice(0, 7) === input.month ? today : null)
  const paymentDate = paidAt ?? effectiveDueDate(expense.dueDay, reference)

  return db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'despesa',
        value: expense.amount,
        description: expense.name,
        categoryId: expense.categoryId,
        source: 'fixed_expense',
        date: paymentDate,
      })
      .returning()

    const [payment] = await tx
      .insert(fixedExpensePayments)
      .values({
        userId,
        fixedExpenseId: expense.id,
        referenceMonth: reference,
        amount: expense.amount,
        paidAt: paymentDate,
        transactionId: transaction!.id,
      })
      .returning()

    return payment
  })
}

/** Desmarca o pagamento do mês: remove payment e transação vinculada juntos (FR-104). */
export async function unpayFixedExpense(
  db: DrizzleDB,
  userId: string,
  input: UnpayFixedExpenseInput,
) {
  const reference = refMonth(input.month)

  const [payment] = await db
    .select()
    .from(fixedExpensePayments)
    .where(
      and(
        eq(fixedExpensePayments.userId, userId),
        eq(fixedExpensePayments.fixedExpenseId, input.id),
        eq(fixedExpensePayments.referenceMonth, reference),
      ),
    )
  if (!payment) return null

  return db.transaction(async (tx) => {
    await tx.delete(fixedExpensePayments).where(eq(fixedExpensePayments.id, payment.id))
    if (payment.transactionId) {
      await tx
        .delete(transactions)
        .where(
          and(eq(transactions.id, payment.transactionId), eq(transactions.userId, userId)),
        )
    }
    return { id: payment.id }
  })
}
