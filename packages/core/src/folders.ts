import type { Transaction } from '@pmf/types'
import { sumAmounts } from './money'

/** Total gasto de uma pasta: soma das despesas associadas (RN-110). */
export function folderTotal(
  txs: Pick<Transaction, 'type' | 'value' | 'folderId'>[],
  folderId: string,
): number {
  return sumAmounts(
    txs.filter((t) => t.folderId === folderId && t.type === 'despesa').map((t) => t.value),
  )
}
