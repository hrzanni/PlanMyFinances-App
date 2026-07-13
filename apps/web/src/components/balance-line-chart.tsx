'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatDate } from '@pmf/core'
import { useChartColors } from '@/lib/chart-colors'

/** Linha do saldo acumulado por dia. Navy: cor de gráfico informativo (FR-093). */
export function BalanceLineChart({ daily }: { daily: Array<{ date: string; balance: number }> }) {
  const colors = useChartColors()
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.line} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(8)}
            tick={{ fontSize: 11, fill: colors.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            tick={{ fontSize: 11, fill: colors.muted }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(v: number | string) => formatCurrency(Number(v))}
            labelFormatter={(d) => formatDate(String(d))}
            contentStyle={{
              background: colors.surface,
              border: `1px solid ${colors.line}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Saldo"
            stroke={colors.navy}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
