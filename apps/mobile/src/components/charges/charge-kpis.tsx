import { Text, View } from 'react-native'
import type { ChargesKpis } from '@pmf/core'
import { money } from '@/lib/format'
import { Card } from '@/components/ui'

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

/** Grade 2×2 com os KPIs da tela Cobranças, calculados no cliente via chargesKpis. */
export function ChargeKpis({ kpis }: { kpis: ChargesKpis }) {
  const neutral = 'text-foreground dark:text-foreground-dark'
  const pos = 'text-positive dark:text-positive-dark'
  const neg = 'text-negative dark:text-negative-dark'
  return (
    <View className="mb-4 gap-2">
      <View className="flex-row gap-2">
        <Cell label="A receber" value={money(kpis.receivable)} cls={neutral} />
        <Cell
          label="Atrasadas"
          value={String(kpis.overdueCount)}
          cls={kpis.overdueCount === 0 ? pos : neg}
        />
      </View>
      <View className="flex-row gap-2">
        <Cell label="Recebido" value={money(kpis.received)} cls={pos} />
        <Cell label="Vence no mês" value={money(kpis.dueThisMonth)} cls={neutral} />
      </View>
    </View>
  )
}
