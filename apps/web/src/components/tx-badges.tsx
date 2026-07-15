'use client'

import { Badge } from '@pmf/ui-web'

interface TxLike {
  source: 'manual' | 'fixed_expense' | 'pluggy' | 'charge' | 'invoice'
  type: 'receita' | 'despesa'
  folderId?: string | null
}

/** Badge de origem da transação (FR-125). Manual não ganha badge (é o caso comum). */
export function SourceBadge({ tx, institution }: { tx: TxLike; institution?: string }) {
  if (tx.source === 'fixed_expense') {
    return <Badge tone="info">{tx.type === 'receita' ? 'receita fixa' : 'gasto fixo'}</Badge>
  }
  if (tx.source === 'pluggy') return <Badge tone="info">{institution ?? 'banco'}</Badge>
  if (tx.source === 'charge') return <Badge tone="info">cobrança</Badge>
  if (tx.source === 'invoice') return <Badge tone="info">fatura</Badge>
  return null
}

export function CategoryBadge({
  categoryName,
  subcategoryName,
}: {
  categoryName?: string | null
  subcategoryName?: string | null
}) {
  if (!categoryName) return null
  return (
    <Badge tone="neutral" className="normal-case">
      {subcategoryName ? `${categoryName} › ${subcategoryName}` : categoryName}
    </Badge>
  )
}
