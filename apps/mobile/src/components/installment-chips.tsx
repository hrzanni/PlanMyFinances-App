import { Pressable, Text, View } from 'react-native'
import type { InstallmentState } from '@pmf/core'

/** Fileira de chips numerados de parcela: pago (verde), atrasada (vermelha), próxima em aberto (destaque). */
export function InstallmentChips({
  installments,
  onSelect,
}: {
  installments: InstallmentState[]
  onSelect?: (n: number) => void
}) {
  const firstUnpaid = installments.find((s) => !s.paid)?.number ?? -1

  const chipCls = (st: InstallmentState) =>
    st.paid
      ? 'border-positive/40 bg-positive/10'
      : st.overdue
        ? 'border-negative'
        : st.number === firstUnpaid
          ? 'border-attention'
          : 'border-line dark:border-line-dark'
  const chipText = (st: InstallmentState) =>
    st.paid
      ? 'text-positive dark:text-positive-dark'
      : st.overdue
        ? 'text-negative dark:text-negative-dark'
        : st.number === firstUnpaid
          ? 'text-attention dark:text-attention-dark'
          : 'text-muted dark:text-muted-dark'

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {installments.map((st) => (
        <Pressable
          key={st.number}
          disabled={!onSelect}
          onPress={() => onSelect?.(st.number)}
          className={`h-8 min-w-8 flex-row items-center justify-center rounded-lg border bg-surface px-1.5 dark:bg-surface-dark ${chipCls(st)}`}
        >
          <Text className={`text-[11px] font-black ${chipText(st)}`}>{st.number}</Text>
          {st.paid ? <Text className={`text-[8px] ${chipText(st)}`}>✓</Text> : null}
        </Pressable>
      ))}
    </View>
  )
}
