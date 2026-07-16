'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { OTHER_SLICE_ID, foldCategorySlices, formatCurrency, type CategorySlice } from '@pmf/core'
import { useChartColors } from '@/lib/chart-colors'

const MAX_NAMED = 5

export function sliceName(s: CategorySlice) {
  if (s.categoryId === null) return 'Sem categoria'
  if (s.categoryId === OTHER_SLICE_ID) return 'Outras'
  return s.categoryName ?? 'Sem categoria'
}

/** Pizza de despesas do mês por categoria (FR-003), com fatia "sem categoria". */
export function PieChartByCategory({ byCategory }: { byCategory: CategorySlice[] }) {
  const colors = useChartColors()
  const slices = foldCategorySlices(byCategory, MAX_NAMED)
  // Fatias nomeadas vêm primeiro no fold, então o índice segue a ordem fixa da paleta.
  const sliceColor = (s: CategorySlice, i: number) => {
    if (s.categoryId === null) return colors.muted
    if (s.categoryId === OTHER_SLICE_ID) return colors.categorical[MAX_NAMED]
    return colors.categorical[i]
  }
  const data = slices.map((s, i) => ({ ...s, name: sliceName(s), fill: sliceColor(s, i) }))

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="55%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              stroke={colors.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.categoryId ?? 'none'} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number | string, _name, entry) =>
                `${formatCurrency(Number(v))} (${(entry?.payload as CategorySlice)?.percent ?? 0}%)`
              }
              contentStyle={{
                background: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 text-sm">
        {data.map((d) => (
          <li
            key={d.categoryId ?? 'none'}
            className="flex items-center gap-2 border-b border-line py-1.5 last:border-0"
          >
            <i className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.fill }} />
            <span className="min-w-0 flex-1 truncate text-body">{d.name}</span>
            <span className="font-bold text-foreground">{d.percent}%</span>
            <span className="w-24 text-right tabular-nums text-muted">
              {formatCurrency(d.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
