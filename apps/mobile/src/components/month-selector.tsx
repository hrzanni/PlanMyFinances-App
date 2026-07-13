import { Pressable, Text, View } from 'react-native'
import { addMonths, monthLabel } from '@/lib/format'

/** Seletor de mês ◀ mês ▶. Mesmo contrato do MonthSelector web. */
export function MonthSelector({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  return (
    <View className="mb-3 flex-row items-center justify-center gap-4 rounded-lg border border-line bg-surface py-2 dark:border-line-dark dark:bg-surface-dark">
      <Pressable onPress={() => onChange(addMonths(month, -1))} accessibilityLabel="Mês anterior">
        <Text className="px-3 text-muted dark:text-muted-dark">◀</Text>
      </Pressable>
      <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
        {monthLabel(month)}
      </Text>
      <Pressable onPress={() => onChange(addMonths(month, 1))} accessibilityLabel="Próximo mês">
        <Text className="px-3 text-muted dark:text-muted-dark">▶</Text>
      </Pressable>
    </View>
  )
}
