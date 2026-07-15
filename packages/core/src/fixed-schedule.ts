import type { MonthlyExpenseStatus } from '@pmf/types'
import { effectiveDueDate } from './date'
import type { FixedExpenseTotals } from './fixed-expenses'
import { sumAmounts } from './money'

export type FixedDueKind = 'late' | 'today' | 'upcoming' | 'other-month'

export interface FixedDueInfo {
  kind: FixedDueKind
  days: number
}

/** Saldo fixo do mês (receitas − despesas), com precisão de centavos. */
export function fixedBalance(totals: {
  expense: FixedExpenseTotals
  income: FixedExpenseTotals
}): number {
  return Math.round((totals.income.total - totals.expense.total) * 100) / 100
}

/** Pendências do mês exibido: contagem e soma dos valores vigentes não pagos. */
export function fixedPendingSummary(
  items: Array<{ monthlyStatus: MonthlyExpenseStatus; amount: string }>,
): { count: number; amount: number } {
  const pending = items.filter((i) => i.monthlyStatus !== 'pago')
  return { count: pending.length, amount: sumAmounts(pending.map((i) => i.amount)) }
}

/** Agrupa itens por dia de vencimento crescente (linha do tempo), estável dentro do dia. */
export function groupFixedByDueDay<T extends { dueDay: number }>(
  items: T[],
): Array<{ dueDay: number; items: T[] }> {
  const groups = new Map<number, T[]>()
  for (const item of [...items].sort((a, b) => a.dueDay - b.dueDay)) {
    const bucket = groups.get(item.dueDay)
    if (bucket) bucket.push(item)
    else groups.set(item.dueDay, [item])
  }
  return [...groups.entries()].map(([dueDay, grouped]) => ({ dueDay, items: grouped }))
}

const DAY_MS = 86_400_000

/** Posição do vencimento em relação a hoje; relativa só quando o mês exibido é o corrente. */
export function fixedDueInfo(dueDay: number, month: string, today: string): FixedDueInfo {
  if (today.slice(0, 7) !== month) return { kind: 'other-month', days: 0 }
  const due = effectiveDueDate(dueDay, `${month}-01`)
  const days = Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS)
  if (days < 0) return { kind: 'late', days: -days }
  if (days === 0) return { kind: 'today', days: 0 }
  return { kind: 'upcoming', days }
}

/** Próximas pendências por dia crescente (vencidos primeiro), para a mini agenda. */
export function nextPendingFixed<T extends { dueDay: number; monthlyStatus: MonthlyExpenseStatus }>(
  items: T[],
  limit = 3,
): T[] {
  return items
    .filter((i) => i.monthlyStatus !== 'pago')
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, limit)
}

function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

/** Badge de status do item na agenda: tom + rótulo pt-BR (relativo no mês corrente). */
export function fixedDueBadge(
  item: {
    type: 'despesa' | 'receita'
    dueDay: number
    monthlyStatus: MonthlyExpenseStatus
    paidAt: string | null
  },
  month: string,
  today: string,
): { tone: 'paid' | 'pending' | 'late'; label: string } {
  if (item.monthlyStatus === 'pago') {
    const verb = item.type === 'receita' ? 'Recebido' : 'Pago'
    return { tone: 'paid', label: item.paidAt ? `${verb} em ${shortDate(item.paidAt)}` : verb }
  }
  const info = fixedDueInfo(item.dueDay, month, today)
  if (item.monthlyStatus === 'vencido') {
    if (info.kind === 'late') {
      return {
        tone: 'late',
        label: info.days === 1 ? 'Vencido há 1 dia' : `Vencido há ${info.days} dias`,
      }
    }
    return { tone: 'late', label: 'Vencido' }
  }
  if (info.kind === 'today') return { tone: 'pending', label: 'Vence hoje' }
  if (info.kind === 'upcoming') {
    return { tone: 'pending', label: info.days === 1 ? 'Amanhã' : `Em ${info.days} dias` }
  }
  return { tone: 'pending', label: 'Pendente' }
}
