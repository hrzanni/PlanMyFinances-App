import { Pressable, Text, View } from 'react-native'

export type ChargeStatusFilter = 'todas' | 'pendentes' | 'atrasadas' | 'pagas'

/** Filtro segmentado de cobranças por estado efetivo (mesmo padrão do filtro em Pastas/Fixos). */
export function ChargeStatusPills({
  value,
  onChange,
  counts,
}: {
  value: ChargeStatusFilter
  onChange: (next: ChargeStatusFilter) => void
  counts: Record<ChargeStatusFilter, number>
}) {
  const options: Array<{ key: ChargeStatusFilter; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'atrasadas', label: 'Atrasadas' },
    { key: 'pagas', label: 'Pagas' },
  ]
  return (
    <View className="mb-3 flex-row self-start rounded-full border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark">
      {options.map((option) => {
        const active = value === option.key
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            className={
              active
                ? 'rounded-full bg-foreground px-3.5 py-1.5 dark:bg-foreground-dark'
                : 'px-3.5 py-1.5'
            }
          >
            <Text
              className={`text-xs font-bold ${
                active
                  ? 'text-background dark:text-background-dark'
                  : 'text-body dark:text-body-dark'
              }`}
            >
              {option.label} {counts[option.key]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
