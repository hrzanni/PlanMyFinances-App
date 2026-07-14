'use client'

import { Badge } from '@pmf/ui-web'

interface TxLike {
  source: 'manual' | 'fixed_expense' | 'pluggy' | 'charge' | 'invoice'
  folderId?: string | null
}

/** Badge de origem da transação (FR-125). Manual não ganha badge (é o caso comum). */
export function SourceBadge({ tx, institution }: { tx: TxLike; institution?: string }) {
  if (tx.source === 'fixed_expense') return <Badge tone="info">gasto fixo</Badge>
  if (tx.source === 'pluggy') return <Badge tone="info">{institution ?? 'banco'}</Badge>
  if (tx.source === 'charge') return <Badge tone="info">cobrança</Badge>
  if (tx.source === 'invoice') return <Badge tone="info">fatura</Badge>
  return null
}

export function FolderBadge({ name, icon }: { name: string; icon?: string | null }) {
  return (
    <Badge tone="info" className="normal-case">
      {icon ? `${icon} ` : ''}
      {name}
    </Badge>
  )
}
