import { Text, View, useColorScheme } from 'react-native'
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import { OTHER_SLICE_ID, foldCategorySlices, type CategorySlice } from '@pmf/core'
import { money } from '@/lib/format'

export const palette = (dark: boolean) => ({
  positive: dark ? '#5CBF8B' : '#2D6E44',
  negative: dark ? '#F0707A' : '#BA1925',
  navy: dark ? '#8FA3D1' : '#303F63',
  line: dark ? '#292D2D' : '#E4E4E2',
  surface: dark ? '#161919' : '#FFFFFF',
  muted: '#9C9B9B',
  // Mesma série categórica do web (chart-colors.ts): ordem fixa validada p/ daltonismo.
  categorical: dark
    ? ['#3987E5', '#199E70', '#C98500', '#008300', '#9085E9', '#D55181']
    : ['#2A78D6', '#1BAF7A', '#EDA100', '#008300', '#4A3AA7', '#E87BA4'],
})

/** Barras receitas × despesas (FR-003) em SVG puro — sem lib pesada (ME-004). */
export function BarsChart({ income, expense }: { income: number; expense: number }) {
  const dark = useColorScheme() === 'dark'
  const c = palette(dark)
  const w = 300
  const h = 140
  const max = Math.max(income, expense, 1)
  const ih = (income / max) * (h - 30)
  const eh = (expense / max) * (h - 30)
  return (
    <View className="items-center">
      <Svg width={w} height={h}>
        <Line x1={0} y1={h - 20} x2={w} y2={h - 20} stroke={c.line} strokeWidth={1} />
        <Rect x={70} y={h - 20 - ih} width={60} height={ih} rx={4} fill={c.positive} />
        <Rect x={170} y={h - 20 - eh} width={60} height={eh} rx={4} fill={c.negative} />
        <SvgText x={100} y={h - 5} fontSize={10} fill={c.muted} textAnchor="middle">
          Receitas
        </SvgText>
        <SvgText x={200} y={h - 5} fontSize={10} fill={c.muted} textAnchor="middle">
          Despesas
        </SvgText>
      </Svg>
    </View>
  )
}

const MAX_NAMED = 5

export function sliceName(s: CategorySlice) {
  if (s.categoryId === null) return 'Sem categoria'
  if (s.categoryId === OTHER_SLICE_ID) return 'Outras'
  return s.categoryName ?? 'Sem categoria'
}

/** Arco de donut entre os ângulos a0→a1 (radianos), raio externo R e interno r. */
function arcPath(cx: number, cy: number, R: number, r: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const pt = (rad: number, radius: number) =>
    `${cx + radius * Math.cos(rad)} ${cy + radius * Math.sin(rad)}`
  return [
    `M ${pt(a0, R)}`,
    `A ${R} ${R} 0 ${large} 1 ${pt(a1, R)}`,
    `L ${pt(a1, r)}`,
    `A ${r} ${r} 0 ${large} 0 ${pt(a0, r)}`,
    'Z',
  ].join(' ')
}

/** Pizza de despesas do mês por categoria (FR-003), com fatia "sem categoria". */
export function PieChart({ byCategory }: { byCategory: CategorySlice[] }) {
  const dark = useColorScheme() === 'dark'
  const c = palette(dark)
  const size = 180
  const R = 84
  const r = 50
  const cx = size / 2

  const slices = foldCategorySlices(byCategory, MAX_NAMED)
  if (slices.length === 0) return null
  const sliceColor = (s: CategorySlice, i: number) => {
    if (s.categoryId === null) return c.muted
    if (s.categoryId === OTHER_SLICE_ID) return c.categorical[MAX_NAMED]!
    return c.categorical[i]!
  }
  const grand = slices.reduce((acc, s) => acc + s.total, 0)

  let angle = -Math.PI / 2
  const arcs = slices.map((s, i) => {
    const a0 = angle
    angle += (s.total / grand) * 2 * Math.PI
    return { key: s.categoryId ?? 'none', color: sliceColor(s, i), a0, a1: angle }
  })

  return (
    <View>
      <View className="items-center">
        <Svg width={size} height={size}>
          {slices.length === 1 ? (
            <>
              <Circle cx={cx} cy={cx} r={R} fill={arcs[0]!.color} />
              <Circle cx={cx} cy={cx} r={r} fill={c.surface} />
            </>
          ) : (
            arcs.map((a) => (
              <Path
                key={a.key}
                d={arcPath(cx, cx, R, r, a.a0, a.a1)}
                fill={a.color}
                stroke={c.surface}
                strokeWidth={2}
              />
            ))
          )}
        </Svg>
      </View>
      <View className="mt-2">
        {slices.map((s, i) => (
          <View
            key={s.categoryId ?? 'none'}
            className="flex-row items-center gap-2 border-b border-line py-1.5 last:border-0 dark:border-line-dark"
          >
            <View
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: sliceColor(s, i) }}
            />
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 text-xs text-body dark:text-body-dark"
            >
              {sliceName(s)}
            </Text>
            <Text className="text-xs font-bold text-foreground dark:text-foreground-dark">
              {s.percent}%
            </Text>
            <Text className="w-24 text-right text-xs tabular-nums text-muted dark:text-muted-dark">
              {money(s.total)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
