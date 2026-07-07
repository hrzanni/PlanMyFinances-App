'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@pmf/core'
import { useChartColors } from '@/lib/chart-colors'

/** Barras receitas × despesas. Verde/vermelho: cores semânticas de valor (FR-093). */
export function IncomeExpenseChart({ income, expense }: { income: number; expense: number }) {
  const colors = useChartColors()
  const data = [{ name: 'Mês', Receitas: income, Despesas: expense }]
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={12}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            formatter={(v: number | string) => formatCurrency(Number(v))}
            cursor={{ fill: colors.line, fillOpacity: 0.4 }}
            contentStyle={{
              background: colors.surface,
              border: `1px solid ${colors.line}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="Receitas" fill={colors.positive} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Despesas" fill={colors.negative} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
