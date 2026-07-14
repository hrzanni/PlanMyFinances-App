import type { Transaction } from '@pmf/types'

export interface CategorySlice {
  categoryId: string | null
  categoryName: string | null
  total: number
  percent: number
}

type TxWithCategory = Pick<Transaction, 'type' | 'value' | 'categoryId'> & {
  categoryName: string | null
}

/** Id sintético da fatia que agrupa o excedente de categorias além do limite do gráfico. */
export const OTHER_SLICE_ID = 'other'

/**
 * Limita a pizza a `maxNamed` categorias nomeadas: o excedente vira uma fatia
 * "outras" (OTHER_SLICE_ID) e a fatia sem categoria (id null) é sempre preservada.
 */
export function foldCategorySlices(slices: CategorySlice[], maxNamed: number): CategorySlice[] {
  const named = slices.filter((s) => s.categoryId !== null)
  const uncategorized = slices.filter((s) => s.categoryId === null)
  if (named.length <= maxNamed) return [...named, ...uncategorized]
  const kept = named.slice(0, maxNamed)
  const rest = named.slice(maxNamed)
  const other: CategorySlice = {
    categoryId: OTHER_SLICE_ID,
    categoryName: null,
    total: Math.round(rest.reduce((acc, s) => acc + s.total * 100, 0)) / 100,
    percent: Math.round(rest.reduce((acc, s) => acc + s.percent * 10, 0)) / 10,
  }
  return [...kept, other, ...uncategorized]
}

/** Despesas do mês agrupadas por categoria (null = sem categoria), para o gráfico de pizza da Início. */
export function expenseByCategory(txs: TxWithCategory[]): CategorySlice[] {
  const cents = new Map<string | null, { categoryName: string | null; total: number }>()
  for (const t of txs) {
    if (t.type !== 'despesa') continue
    const entry = cents.get(t.categoryId) ?? { categoryName: t.categoryName, total: 0 }
    entry.total += Math.round(Number(t.value) * 100)
    cents.set(t.categoryId, entry)
  }
  const grandTotal = [...cents.values()].reduce((acc, e) => acc + e.total, 0)
  if (grandTotal === 0) return []
  return [...cents.entries()]
    .map(([categoryId, e]) => ({
      categoryId,
      categoryName: e.categoryName,
      total: e.total / 100,
      percent: Math.round((e.total / grandTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total)
}
