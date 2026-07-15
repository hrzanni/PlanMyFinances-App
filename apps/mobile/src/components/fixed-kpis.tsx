import { Text, View } from 'react-native'
import { fixedBalance, type FixedExpenseTotals } from '@pmf/core'
import { money } from '@/lib/format'
import { Card } from '@/components/ui'

interface FixedKpisProps {
  totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals } | undefined
  pending: { count: number; amount: number }
}

function Cell({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <Card className="flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
        {label}
      </Text>
      <Text className={`mt-1 text-base font-black tabular-nums ${cls}`} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  )
}

/** Grade 2×2 com os 4 KPIs da tela Fixos. */
export function FixedKpis({ totals, pending }: FixedKpisProps) {
  const balance = totals ? fixedBalance(totals) : 0
  const neutral = 'text-foreground dark:text-foreground-dark'
  const pos = 'text-positive dark:text-positive-dark'
  const neg = 'text-negative dark:text-negative-dark'
  return (
    <View className="mb-4 gap-2">
      <View className="flex-row gap-2">
        <Cell label="Despesas fixas" value={money(totals?.expense.total ?? 0)} cls={neutral} />
        <Cell label="Receitas fixas" value={money(totals?.income.total ?? 0)} cls={neutral} />
      </View>
      <View className="flex-row gap-2">
        <Cell
          label="Saldo fixo do mês"
          value={`${balance < 0 ? '−' : '+'}${money(Math.abs(balance))}`}
          cls={balance < 0 ? neg : pos}
        />
        <Cell
          label="Pendências"
          value={
            pending.count === 0
              ? 'Tudo em dia ✓'
              : `${pending.count} ${pending.count === 1 ? 'item' : 'itens'} · ${money(pending.amount)}`
          }
          cls={pending.count === 0 ? pos : neg}
        />
      </View>
    </View>
  )
}
