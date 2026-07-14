import { and, eq, gte, lte } from 'drizzle-orm'
import { accumulatedBalanceByDay, expenseByCategory, monthRange, monthlyBalance } from '@pmf/core'
import type { DrizzleDB } from '../db/client'
import { categories, transactions } from '../db/schema'

/** Cards e gráficos do mês (FR-003): saldo em RN-001, acumulado por dia, despesas por categoria. */
export async function monthSummary(db: DrizzleDB, userId: string, month: string) {
  const { from, to } = monthRange(new Date(`${month}-15T12:00:00Z`))
  const rows = await db
    .select({
      type: transactions.type,
      value: transactions.value,
      date: transactions.date,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    )

  return {
    ...monthlyBalance(rows),
    incomeCount: rows.filter((r) => r.type === 'receita').length,
    expenseCount: rows.filter((r) => r.type === 'despesa').length,
    daily: accumulatedBalanceByDay(rows),
    byCategory: expenseByCategory(rows),
  }
}
