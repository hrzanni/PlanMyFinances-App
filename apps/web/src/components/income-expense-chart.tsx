'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@pmf/core'

/** Barras receitas × despesas. Verde/vermelho: cores semânticas de valor (FR-093). */
export function IncomeExpenseChart({ income, expense }: { income: number; expense: number }) {
  const data = [{ name: 'Mês', Receitas: income, Despesas: expense }]
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={12}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            formatter={(v: number | string) => formatCurrency(Number(v))}
            cursor={{ fill: 'rgb(var(--line) / 0.4)' }}
            contentStyle={{
              background: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--line))',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="Receitas" fill="rgb(var(--positive))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Despesas" fill="rgb(var(--negative))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
