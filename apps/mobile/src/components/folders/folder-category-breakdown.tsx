import { Text, View, useColorScheme } from 'react-native'
import { OTHER_SLICE_ID, foldCategorySlices, type CategorySlice } from '@pmf/core'
import { palette, sliceName } from '@/components/charts'
import { money } from '@/lib/format'
import { trpc } from '@/lib/trpc'

const MAX_NAMED = 5

/** Quanto foi gasto em cada categoria dentro da pasta (ex.: "Viagem RJ" → Transporte, Hospedagem...). */
export function FolderCategoryBreakdown({ folderId }: { folderId: string }) {
  const { data, isLoading } = trpc.folders.categoryBreakdown.useQuery({ id: folderId })
  const dark = useColorScheme() === 'dark'
  const c = palette(dark)

  if (isLoading) {
    return <Text className="text-xs text-muted dark:text-muted-dark">Carregando categorias…</Text>
  }
  if (!data || data.length === 0) return null

  const slices = foldCategorySlices(data, MAX_NAMED)
  const barColor = (s: CategorySlice, i: number) => {
    if (s.categoryId === null) return c.muted
    if (s.categoryId === OTHER_SLICE_ID) return c.categorical[MAX_NAMED]!
    return c.categorical[i]!
  }

  return (
    <View>
      <Text className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
        Por categoria
      </Text>
      <View className="gap-2">
        {slices.map((s, i) => (
          <View key={s.categoryId ?? 'none'} className="flex-row items-center gap-2.5">
            <Text
              numberOfLines={1}
              className="w-20 text-xs font-bold text-body dark:text-body-dark"
            >
              {sliceName(s)}
            </Text>
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dark">
              <View
                className="h-full rounded-full"
                style={{ width: `${s.percent}%`, backgroundColor: barColor(s, i) }}
              />
            </View>
            <Text className="w-20 text-right text-xs font-bold tabular-nums text-foreground dark:text-foreground-dark">
              {money(s.total)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
