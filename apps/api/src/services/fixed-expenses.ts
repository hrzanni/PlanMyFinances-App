import { and, eq, asc } from 'drizzle-orm'
import {
  effectiveDueDate,
  fixedExpenseStatus,
  fixedExpenseTotals,
  isFixedExpenseActiveInMonth,
  resolveAmountForMonth,
} from '@pmf/core'
import type {
  CreateFixedExpenseInput,
  PayFixedExpenseInput,
  UnpayFixedExpenseInput,
  UpdateFixedExpenseInput,
} from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { fixedExpensePayments, fixedExpenses, transactions } from '../db/schema'
import {
  fetchAmountHistoryByExpense,
  fetchAmountHistoryByUser,
  insertAmountReajuste,
  insertInitialAmountHistory,
} from './fixed-expense-amount-history'

function refMonth(month: string): string {
  return `${month}-01`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function currentMonth(): string {
  return refMonth(todayIso().slice(0, 7))
}

/** Lista os fixos vigentes no mês (FR-101/102): valor resolvido pelo histórico de reajustes. */
export async function listFixedExpenses(db: DrizzleDB, userId: string, month: string) {
  const reference = refMonth(month)
  const today = todayIso()

  const allExpenses = await db
    .select()
    .from(fixedExpenses)
    .where(and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.status, 'active')))
    .orderBy(asc(fixedExpenses.dueDay), asc(fixedExpenses.name))
  const expenses = allExpenses.filter((e) =>
    isFixedExpenseActiveInMonth(e.effectiveFrom, e.effectiveUntil, reference),
  )

  const [payments, history] = await Promise.all([
    db
      .select()
      .from(fixedExpensePayments)
      .where(
        and(
          eq(fixedExpensePayments.userId, userId),
          eq(fixedExpensePayments.referenceMonth, reference),
        ),
      ),
    fetchAmountHistoryByUser(db, userId),
  ])

  const items = expenses
    .map((expense) => {
      const amount = resolveAmountForMonth(
        history.filter((h) => h.fixedExpenseId === expense.id),
        reference,
      )
      if (amount == null) return null
      const payment = payments.find((p) => p.fixedExpenseId === expense.id) ?? null
      return {
        ...expense,
        amount,
        payment,
        monthlyStatus: fixedExpenseStatus({
          dueDay: expense.dueDay,
          month: reference,
          today,
          paidAt: payment?.paidAt ?? null,
        }),
      }
    })
    .filter((i): i is NonNullable<typeof i> => i != null)

  const toTotalsInput = (rows: typeof items) =>
    rows.map((i) => ({ amount: i.amount, paidAmount: i.payment?.amount ?? null }))

  const totals = {
    expense: fixedExpenseTotals(toTotalsInput(items.filter((i) => i.type === 'despesa'))),
    income: fixedExpenseTotals(toTotalsInput(items.filter((i) => i.type === 'receita'))),
  }

  return { items, totals }
}

/** Cria o fixo a partir do mês corrente (nunca aparece antes disso) e sua 1ª entrada de valor. */
export async function createFixedExpense(
  db: DrizzleDB,
  userId: string,
  input: CreateFixedExpenseInput,
) {
  const effectiveFrom = currentMonth()
  const amount = input.amount.toFixed(2)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(fixedExpenses)
      .values({
        userId,
        name: input.name,
        type: input.type,
        dueDay: input.dueDay,
        categoryId: input.categoryId,
        effectiveFrom,
      })
      .returning()
    if (!row) return null

    await insertInitialAmountHistory(tx, { userId, fixedExpenseId: row.id, amount, effectiveFrom })

    return { ...row, amount }
  })
}

type FixedExpenseRow = typeof fixedExpenses.$inferSelect

/**
 * Campos sem valor (nome, categoria, dia, tipo, status) são sobrescritos direto.
 * Reajuste de valor não sobrescreve nada: insere uma linha nova no histórico,
 * válida a partir de `amountEffectiveFrom` — meses anteriores (pagos ou não) mantêm
 * o valor antigo (FR-105 estendido a meses não pagos).
 */
export async function updateFixedExpense(
  db: DrizzleDB,
  userId: string,
  input: UpdateFixedExpenseInput,
): Promise<FixedExpenseRow | null | 'amount_effective_from_required' | 'invalid_amount_effective_from'> {
  const { id, amount, amountEffectiveFrom, ...rest } = input

  return db.transaction(async (tx) => {
    let row: FixedExpenseRow | null
    if (Object.keys(rest).length > 0) {
      const [updated] = await tx
        .update(fixedExpenses)
        .set(rest)
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
        .returning()
      row = updated ?? null
    } else {
      const [existing] = await tx
        .select()
        .from(fixedExpenses)
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
      row = existing ?? null
    }
    if (!row) return null

    if (amount != null) {
      if (!amountEffectiveFrom) return 'amount_effective_from_required'
      const result = await insertAmountReajuste(tx, {
        userId,
        fixedExpenseId: id,
        amount: amount.toFixed(2),
        effectiveFrom: refMonth(amountEffectiveFrom),
      })
      if (result === 'invalid_amount_effective_from') return result
    }

    return row
  })
}

/** Encerra o fixo a partir do mês seguinte a lastActiveMonth; preserva todo o histórico. */
export async function endFixedExpense(
  db: DrizzleDB,
  userId: string,
  id: string,
  lastActiveMonth: string,
) {
  const [row] = await db
    .update(fixedExpenses)
    .set({ effectiveUntil: refMonth(lastActiveMonth) })
    .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
    .returning()
  return row ?? null
}

/** Excluir definitivamente: remove o fixo e todo o histórico (valor e pagamentos) junto. */
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

  const history = await fetchAmountHistoryByExpense(db, expense.id)
  const amount = resolveAmountForMonth(history, reference)
  if (amount == null) return null

  const today = todayIso()
  const paidAt = input.paidAt ?? (today.slice(0, 7) === input.month ? today : null)
  const paymentDate = paidAt ?? effectiveDueDate(expense.dueDay, reference)

  return db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: expense.type,
        value: amount,
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
        amount,
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
