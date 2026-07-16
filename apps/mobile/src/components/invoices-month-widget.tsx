import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { deriveInstallments, invoiceMonthSummary } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { money, monthLabel } from '@/lib/format'
import { Card } from '@/components/ui'
import { globalOverdue, toPayments, toSchedule } from './invoice-derive'

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** Widget "Faturas do mês" — resumo + alerta de atraso + próximas parcelas a vencer. */
export function InvoicesMonthWidget({ month }: { month: string }) {
  const router = useRouter()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const list = trpc.invoices.list.useQuery()

  const rows = list.data ?? []

  const { summary, ovd, items } = useMemo(() => {
    const heroRows = rows.map((r) => ({ schedule: toSchedule(r), payments: toPayments(r) }))
    const summary = invoiceMonthSummary(heroRows, month, today)
    const ovd = globalOverdue(heroRows, today)

    const items: Array<{ label: string; dueDate: string; value: number; late: boolean }> = []
    for (const row of rows) {
      const schedule = toSchedule(row)
      for (const st of deriveInstallments(schedule, toPayments(row), today)) {
        if (!st.paid && st.dueDate.slice(0, 7) <= month) {
          items.push({
            label: row.description || row.cardName,
            dueDate: st.dueDate,
            value: schedule.amountPerInstallment,
            late: st.overdue,
          })
        }
      }
    }
    items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

    return { summary, ovd, items }
  }, [rows, month, today])

  if (list.isLoading) {
    return (
      <Card className="mt-4">
        <Text className="py-4 text-center text-sm text-muted dark:text-muted-dark">
          Carregando…
        </Text>
      </Card>
    )
  }

  if (rows.length === 0) return null

  const paidPct = summary.total ? Math.round((summary.paidAmt / summary.total) * 100) : 0

  return (
    <Card className="mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[10px] font-black uppercase tracking-wider text-muted dark:text-muted-dark">
          Faturas de {monthLabel(month).split(' ')[0]}
        </Text>
        <Pressable onPress={() => router.push('/mais/faturas')}>
          <Text className="text-xs font-bold text-foreground dark:text-foreground-dark">
            ver todas →
          </Text>
        </Pressable>
      </View>

      {summary.due === 0 ? (
        <Text className="text-lg font-black text-positive dark:text-positive-dark">
          ✓ Faturas do mês em dia
        </Text>
      ) : (
        <Text className="text-2xl font-black tracking-tight text-foreground dark:text-foreground-dark">
          {money(summary.due)}{' '}
          <Text className="text-xs font-normal text-muted dark:text-muted-dark">
            a pagar · {summary.nPend} {summary.nPend === 1 ? 'parcela' : 'parcelas'}
          </Text>
        </Text>
      )}

      <View className="my-2 h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <View
          className="h-full rounded-full bg-positive dark:bg-positive-dark"
          style={{ width: `${paidPct}%` }}
        />
      </View>
      <Text className="text-[11px] text-muted dark:text-muted-dark">
        {money(summary.paidAmt)} pagos de {money(summary.total)} no mês
      </Text>

      {ovd.count > 0 ? (
        <Text className="mt-1.5 text-xs font-bold text-negative dark:text-negative-dark">
          ⚠ {ovd.count} {ovd.count === 1 ? 'parcela em atraso' : 'parcelas em atraso'} ·{' '}
          {money(ovd.amt)}
        </Text>
      ) : null}

      <View className="mt-2">
        {items.map((item, i) => (
          <View
            key={`${item.label}-${item.dueDate}-${i}`}
            className={`flex-row items-center gap-2 py-1.5 ${
              i > 0 ? 'border-t border-line dark:border-line-dark' : ''
            }`}
          >
            <Text
              className="min-w-0 flex-1 text-xs font-bold text-foreground dark:text-foreground-dark"
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <Text
              className={
                item.late
                  ? 'text-xs font-bold text-negative dark:text-negative-dark'
                  : 'text-xs text-muted dark:text-muted-dark'
              }
            >
              {item.late ? 'venceu' : 'vence'} {ddmm(item.dueDate)}
            </Text>
            <Text
              className={`text-xs font-bold ${
                item.late
                  ? 'text-negative dark:text-negative-dark'
                  : 'text-foreground dark:text-foreground-dark'
              }`}
            >
              {money(item.value)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  )
}
