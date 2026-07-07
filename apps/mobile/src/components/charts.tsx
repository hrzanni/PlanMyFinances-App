import { View, useColorScheme } from 'react-native'
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg'

const palette = (dark: boolean) => ({
  positive: dark ? '#5CBF8B' : '#2D6E44',
  negative: dark ? '#F0707A' : '#BA1925',
  navy: dark ? '#8FA3D1' : '#303F63',
  line: dark ? '#292D2D' : '#E4E4E2',
  muted: '#9C9B9B',
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

/** Linha do saldo acumulado por dia (FR-006), navy conforme o tema. */
export function BalanceLineChart({ daily }: { daily: Array<{ date: string; balance: number }> }) {
  const dark = useColorScheme() === 'dark'
  const c = palette(dark)
  const w = 320
  const h = 150
  if (daily.length === 0) return null

  const values = daily.map((d) => d.balance)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const step = daily.length > 1 ? (w - 24) / (daily.length - 1) : 0
  const points = daily
    .map((d, i) => `${12 + i * step},${12 + (1 - (d.balance - min) / range) * (h - 24)}`)
    .join(' ')

  return (
    <View className="items-center">
      <Svg width={w} height={h}>
        <Line x1={0} y1={h - 12} x2={w} y2={h - 12} stroke={c.line} strokeWidth={1} />
        <Polyline points={points} fill="none" stroke={c.navy} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </View>
  )
}
