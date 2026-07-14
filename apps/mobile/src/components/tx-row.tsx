import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatDate } from '@pmf/core'
import type { RouterOutputs } from '@/lib/trpc'
import { money } from '@/lib/format'
import { Badge } from './ui'

type Tx = RouterOutputs['transactions']['list']['items'][number]

/** Linha de transação reutilizada em Início, Histórico e Pastas. */
export function TxRow({ tx, onDelete }: { tx: Tx; onDelete?: () => void }) {
  const positive = tx.type === 'receita'
  return (
    <View className="flex-row items-center gap-3 border-b border-line py-2.5 dark:border-line-dark">
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-sm font-bold text-foreground dark:text-foreground-dark"
        >
          {tx.description || (positive ? 'Receita' : 'Despesa')}
        </Text>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-2">
          <Text className="text-[11px] text-muted dark:text-muted-dark">{formatDate(tx.date)}</Text>
          {tx.categoryName ? (
            <Badge
              tone="neutral"
              label={
                tx.subcategoryName
                  ? `${tx.categoryName} › ${tx.subcategoryName}`
                  : tx.categoryName
              }
            />
          ) : null}
          {tx.source === 'fixed_expense' ? <Badge tone="info" label="gasto fixo" /> : null}
          {tx.source === 'pluggy' ? <Badge tone="info" label="banco" /> : null}
          {tx.source === 'charge' ? <Badge tone="info" label="cobrança" /> : null}
          {tx.source === 'invoice' ? <Badge tone="info" label="fatura" /> : null}
        </View>
      </View>
      <Text
        className={`text-sm font-bold tabular-nums ${
          positive
            ? 'text-positive dark:text-positive-dark'
            : 'text-negative dark:text-negative-dark'
        }`}
      >
        {positive ? '+ ' : '− '}
        {money(tx.value)}
      </Text>
      {onDelete ? (
        <Pressable accessibilityLabel="Excluir transação" hitSlop={8} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color="#9C9B9B" />
        </Pressable>
      ) : null}
    </View>
  )
}
