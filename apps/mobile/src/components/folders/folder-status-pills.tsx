import { Pressable, Text, View } from 'react-native'

export type FolderStatusFilter = 'todas' | 'ativas' | 'arquivadas'

/** Filtro segmentado Todas/Ativas/Arquivadas com contagens (mesmo padrão do filtro de tipo em Fixos). */
export function FolderStatusPills({
  value,
  onChange,
  counts,
}: {
  value: FolderStatusFilter
  onChange: (next: FolderStatusFilter) => void
  counts: Record<FolderStatusFilter, number>
}) {
  const options: Array<{ key: FolderStatusFilter; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'ativas', label: 'Ativas' },
    { key: 'arquivadas', label: 'Arquivadas' },
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
