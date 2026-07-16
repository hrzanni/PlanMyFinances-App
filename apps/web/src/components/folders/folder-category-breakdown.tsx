import { OTHER_SLICE_ID, foldCategorySlices, type CategorySlice } from '@pmf/core'
import { LoadingState } from '@pmf/ui-web'
import { money } from '@/lib/format'
import { useChartColors } from '@/lib/chart-colors'
import { sliceName } from '@/components/pie-chart-by-category'
import { trpc } from '@/lib/trpc'

const MAX_NAMED = 5

/** Quanto foi gasto em cada categoria dentro da pasta (ex.: "Viagem RJ" → Transporte, Hospedagem...). */
export function FolderCategoryBreakdown({ folderId }: { folderId: string }) {
  const { data, isLoading } = trpc.folders.categoryBreakdown.useQuery({ id: folderId })
  const colors = useChartColors()

  if (isLoading) return <LoadingState label="Carregando categorias…" />
  if (!data || data.length === 0) return null

  const slices = foldCategorySlices(data, MAX_NAMED)
  const barColor = (s: CategorySlice, i: number) => {
    if (s.categoryId === null) return colors.muted
    if (s.categoryId === OTHER_SLICE_ID) return colors.categorical[MAX_NAMED]
    return colors.categorical[i]
  }

  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        Por categoria
      </div>
      <div className="flex flex-col gap-2">
        {slices.map((s, i) => (
          <div key={s.categoryId ?? 'none'} className="flex items-center gap-2.5 text-xs">
            <span className="w-24 flex-none truncate font-bold text-body">{sliceName(s)}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{ width: `${s.percent}%`, background: barColor(s, i) }}
              />
            </div>
            <span className="w-20 flex-none text-right font-bold tabular-nums text-foreground">
              {money(s.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
