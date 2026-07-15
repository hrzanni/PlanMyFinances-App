import { fixedBalance, type FixedExpenseTotals } from '@pmf/core'
import { money } from '@/lib/format'

interface FixedKpisProps {
  totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals } | undefined
  pending: { count: number; amount: number }
}

/** Faixa única de 4 KPIs da tela Fixos (despesas, receitas, saldo fixo, pendências). */
export function FixedKpis({ totals, pending }: FixedKpisProps) {
  const balance = totals ? fixedBalance(totals) : 0
  const cells = [
    { label: 'Despesas fixas', value: money(totals?.expense.total ?? 0), cls: 'text-foreground' },
    { label: 'Receitas fixas', value: money(totals?.income.total ?? 0), cls: 'text-foreground' },
    {
      label: 'Saldo fixo do mês',
      value: `${balance < 0 ? '−' : '+'}${money(Math.abs(balance))}`,
      cls: balance < 0 ? 'text-negative' : 'text-positive',
    },
    {
      label: 'Pendências',
      value:
        pending.count === 0
          ? 'Tudo em dia ✓'
          : `${pending.count} ${pending.count === 1 ? 'item' : 'itens'} · ${money(pending.amount)}`,
      cls: pending.count === 0 ? 'text-positive' : 'text-negative',
    },
  ]
  return (
    <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-4 md:divide-x md:divide-line">
      {cells.map((cell) => (
        <div key={cell.label} className="px-4 py-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {cell.label}
          </div>
          <div className={`mt-1 truncate text-lg font-black tabular-nums ${cell.cls}`}>
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  )
}
