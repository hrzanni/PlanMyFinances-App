'use client'

import { formatDate } from '@pmf/core'
import { Td } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { SourceBadge, FolderBadge, CategoryBadge } from '@/components/tx-badges'
import type { TransactionItem } from '@/components/transaction-form'

interface Props {
  tx: TransactionItem
  onEdit: () => void
  onDelete: () => void
}

/** Linha da tabela de Histórico (extraída para manter page.tsx sob o limite de linhas). */
export function TransactionTableRow({ tx, onEdit, onDelete }: Props) {
  const { data: folders } = trpc.folders.list.useQuery()
  const folder = folders?.find((f) => f.id === tx.folderId)

  return (
    <tr>
      <Td className="whitespace-nowrap">{formatDate(tx.date)}</Td>
      <Td>
        <span className="font-bold text-foreground">
          {tx.description || (tx.type === 'receita' ? 'Receita' : 'Despesa')}
        </span>
        {tx.categoryName ? (
          <span className="ml-2">
            <CategoryBadge categoryName={tx.categoryName} subcategoryName={tx.subcategoryName} />
          </span>
        ) : null}
        {folder ? (
          <span className="ml-2">
            <FolderBadge name={folder.name} icon={folder.icon} />
          </span>
        ) : null}
      </Td>
      <Td>
        <SourceBadge tx={tx} />
      </Td>
      <Td numeric>
        <span className={`font-bold ${tx.type === 'receita' ? 'text-positive' : 'text-negative'}`}>
          {tx.type === 'receita' ? '+ ' : '− '}
          {money(tx.value)}
        </span>
      </Td>
      <Td numeric>
        <button
          type="button"
          aria-label="Editar transação"
          onClick={onEdit}
          className="mr-2 text-muted hover:text-foreground"
        >
          ✏️
        </button>
        <button
          type="button"
          aria-label="Excluir transação"
          onClick={onDelete}
          className="text-muted hover:text-negative"
        >
          🗑
        </button>
      </Td>
    </tr>
  )
}
