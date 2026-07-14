import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { installmentDueDate } from '@pmf/core'
import { money } from '@/lib/format'
import { Badge, Card } from './ui'
import { Chevron } from './installments-panel'
import { toSchedule, type InvoiceRow } from './invoice-derive'

const endLabel = (row: InvoiceRow) => {
  const iso = installmentDueDate(toSchedule(row).firstDueDate, row.totalInstallments)
  const d = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 15))
  const m = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${m}/${iso.slice(2, 4)}`
}

/** Seção recolhida das faturas totalmente pagas. */
export function ClosedInvoices({
  rows,
  showCard,
}: {
  rows: InvoiceRow[]
  showCard: boolean
}) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null

  return (
    <View className="mt-3">
      <Pressable className="flex-row items-center gap-2 px-1 py-2" onPress={() => setOpen((v) => !v)}>
        <Text className="text-[11px] font-black uppercase tracking-widest text-muted dark:text-muted-dark">
          Faturas encerradas
        </Text>
        <View className="rounded-full bg-muted/10 px-2 py-0.5">
          <Text className="text-[10px] text-muted dark:text-muted-dark">{rows.length}</Text>
        </View>
        <Chevron open={open} />
      </Pressable>

      {open
        ? rows.map((row) => (
            <Card key={row.id} className="mb-2 opacity-90">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-sm font-bold text-body dark:text-body-dark">
                  {row.description || row.cardName}
                </Text>
                <Badge tone="paid" label={`encerrada ${endLabel(row)} ✓`} />
              </View>
              <Text className="mt-1 text-[11px] tabular-nums text-muted dark:text-muted-dark">
                {showCard && row.cardId ? `${row.cardName} · ` : ''}
                {row.totalInstallments}/{row.totalInstallments} pagas · total{' '}
                {money(Number(row.amountPerInstallment) * row.totalInstallments)}
              </Text>
            </Card>
          ))
        : null}
    </View>
  )
}
