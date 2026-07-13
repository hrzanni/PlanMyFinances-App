import type { Transaction } from '@pmf/types'
import { sumAmounts } from './money'

export interface MonthlyBalance {
  income: number
  expense: number
  balance: number
}

/** Saldo do período: receitas − despesas (RN-001). */
export function monthlyBalance(txs: Pick<Transaction, 'type' | 'value'>[]): MonthlyBalance {
  const income = sumAmounts(txs.filter((t) => t.type === 'receita').map((t) => t.value))
  const expense = sumAmounts(txs.filter((t) => t.type === 'despesa').map((t) => t.value))
  return { income, expense, balance: Math.round((income - expense) * 100) / 100 }
}

export interface DailyPoint {
  date: string
  balance: number
}

/** Saldo acumulado por dia do mês, para o gráfico de linha do Dashboard (FR-006). */
export function accumulatedBalanceByDay(
  txs: Pick<Transaction, 'type' | 'value' | 'date'>[],
): DailyPoint[] {
  const byDate = new Map<string, number>()
  for (const t of txs) {
    const signed = (t.type === 'receita' ? 1 : -1) * Math.round(Number(t.value) * 100)
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + signed)
  }
  const days = [...byDate.keys()].sort()
  let acc = 0
  return days.map((date) => {
    acc += byDate.get(date) ?? 0
    return { date, balance: acc / 100 }
  })
}
