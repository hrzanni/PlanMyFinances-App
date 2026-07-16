/**
 * Cronograma e estado derivados de parcela de cobrança (redesign visual, sem migration).
 * Cobrança não tem parcela própria no banco (diferente de fatura): o cronograma é só
 * calculado a partir de `dueDate` (âncora da parcela 1, cadência mensal) e `amountPaid`
 * acumulado. Datas ISO 'YYYY-MM-DD'.
 */

import { installmentDueDate, type InstallmentState } from './invoice-installments'
import { installmentTotals } from './installments'
import { dueThisMonth } from './date'

const cents = (v: number) => Math.round(v * 100)

export interface ChargeForSchedule {
  amountPerInstallment: number
  totalInstallments: number
  amountPaid: number
  dueDate: string | null
}

/** Parcela N = dueDate + (N-1) meses; pagas = as primeiras `floor(amountPaid / parcela)`, em ordem. */
export function deriveChargeInstallments(
  charge: ChargeForSchedule,
  today: string,
): InstallmentState[] | null {
  if (!charge.dueDate) return null
  const dueDate = charge.dueDate
  const perCents = cents(charge.amountPerInstallment)
  const paidCount = perCents > 0 ? Math.floor(cents(charge.amountPaid) / perCents) : 0
  return Array.from({ length: charge.totalInstallments }, (_, i) => {
    const number = i + 1
    const installmentDue = installmentDueDate(dueDate, number)
    const paid = number <= paidCount
    return {
      number,
      dueDate: installmentDue,
      paid,
      overdue: !paid && installmentDue < today,
      amountPaid: paid ? charge.amountPerInstallment : null,
      paymentId: null,
    }
  })
}

export type ChargeEffectiveState = 'pago' | 'atrasada' | 'cobrado' | 'pendente'

export interface ChargeForState extends ChargeForSchedule {
  status: string
}

/**
 * Estado exibido no card/badge (não é o `status` persistido, que continua livre em
 * pendente/cobrado/pago): soma atraso derivado do cronograma, ou do `dueDate` direto
 * quando não há cronograma (cobrança sem vencimento).
 */
export function chargeEffectiveState(charge: ChargeForState, today: string): ChargeEffectiveState {
  const totals = installmentTotals(charge.amountPerInstallment, charge.totalInstallments, charge.amountPaid)
  if (charge.status === 'pago' || totals.remaining <= 0) return 'pago'
  const schedule = deriveChargeInstallments(charge, today)
  const late = schedule ? schedule.some((s) => s.overdue) : !!charge.dueDate && charge.dueDate < today
  if (late) return 'atrasada'
  return charge.status === 'cobrado' ? 'cobrado' : 'pendente'
}

/** Próxima parcela em aberto, para sugerir o valor ao abrir o recebimento a partir de um chip. */
export function nextUnpaidChargeInstallment(
  charge: ChargeForSchedule,
  today: string,
): { number: number; dueDate: string; amount: number } | null {
  const schedule = deriveChargeInstallments(charge, today)
  const next = schedule?.find((s) => !s.paid)
  return next ? { number: next.number, dueDate: next.dueDate, amount: charge.amountPerInstallment } : null
}

export interface ChargesKpis {
  receivable: number
  received: number
  overdueCount: number
  dueThisMonth: number
}

/**
 * KPIs agregados no cliente a partir de `charges.list` — substitui o antigo endpoint
 * `charges.summary` (mesmo padrão adotado em Faturas v2). Mantém a semântica original:
 * "a receber"/"vence este mês" somam só cobranças não pagas; "recebido" soma todas.
 */
export function chargesKpis(charges: ChargeForState[], today: string): ChargesKpis {
  const ref = new Date(today)
  let receivableCents = 0
  let receivedCents = 0
  let dueThisMonthCents = 0
  let overdueCount = 0
  for (const charge of charges) {
    const totals = installmentTotals(charge.amountPerInstallment, charge.totalInstallments, charge.amountPaid)
    receivedCents += cents(charge.amountPaid)
    if (charge.status !== 'pago') {
      receivableCents += cents(totals.remaining)
      if (dueThisMonth(charge.dueDate, ref)) dueThisMonthCents += cents(totals.remaining)
    }
    if (chargeEffectiveState(charge, today) === 'atrasada') overdueCount++
  }
  return {
    receivable: receivableCents / 100,
    received: receivedCents / 100,
    dueThisMonth: dueThisMonthCents / 100,
    overdueCount,
  }
}
