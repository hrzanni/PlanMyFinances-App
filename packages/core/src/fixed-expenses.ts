import type { MonthlyExpenseStatus } from '@pmf/types'
import { effectiveDueDate } from './date'
import { sumAmounts } from './money'

export interface FixedExpenseStatusInput {
  dueDay: number
  /** Mês em análise, normalizado (YYYY-MM-01). */
  month: string
  /** Data de hoje (YYYY-MM-DD), vinda do servidor (RN-002). */
  today: string
  /** Data do pagamento no mês, ou null se não pago. */
  paidAt: string | null
}

/**
 * Status mensal derivado de um gasto fixo (RN-100):
 * pago quando existe pagamento no mês; vencido quando o vencimento efetivo já
 * passou sem pagamento; pendente caso contrário (inclui meses futuros).
 */
export function fixedExpenseStatus(input: FixedExpenseStatusInput): MonthlyExpenseStatus {
  if (input.paidAt) return 'pago'
  const due = effectiveDueDate(input.dueDay, input.month)
  return due < input.today ? 'vencido' : 'pendente'
}

export interface FixedExpenseMonthItem {
  /** Valor vigente do gasto fixo. */
  amount: string
  /** Snapshot pago no mês, ou null se não pago (FR-105). */
  paidAmount: string | null
}

export interface FixedExpenseTotals {
  total: number
  paid: number
  pending: number
}

/**
 * Totais do mês (RN-101): pago soma os snapshots; pendente soma o valor vigente
 * dos não pagos; total = pago + pendente (coerente mesmo se o valor mudou
 * depois de um pagamento — o histórico nunca é reescrito, FR-105).
 */
export function fixedExpenseTotals(items: FixedExpenseMonthItem[]): FixedExpenseTotals {
  const paid = sumAmounts(items.map((i) => i.paidAmount).filter((v): v is string => v != null))
  const pending = sumAmounts(items.filter((i) => i.paidAmount == null).map((i) => i.amount))
  return { total: Math.round((paid + pending) * 100) / 100, paid, pending }
}
