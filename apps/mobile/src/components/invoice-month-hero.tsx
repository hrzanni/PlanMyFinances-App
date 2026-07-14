import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import {
  invoiceMonthSummary,
  type InstallmentPayment,
  type InvoiceSchedule,
} from '@pmf/core'
import { addMonths, money, monthLabel } from '@/lib/format'
import { globalOverdue } from './invoice-derive'

type HeroRow = { schedule: InvoiceSchedule; payments: InstallmentPayment[] }

const BAR_H = 56

const shortMonth = (m: string) =>
  new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 15))
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')

const fmtK = (n: number) =>
  n >= 1000
    ? (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'
    : String(Math.round(n))

/** Hero escuro + barras clicáveis dos 12 meses (mês corrente −4/+7). */
export function InvoiceMonthHero({
  rows,
  month,
  onMonthChange,
  today,
}: {
  rows: HeroRow[]
  month: string
  onMonthChange: (m: string) => void
  today: string
}) {
  const current = today.slice(0, 7)
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => addMonths(current, i - 4)),
    [current],
  )
  const totals = useMemo(
    () => months.map((m) => ({ m, s: invoiceMonthSummary(rows, m, today) })),
    [months, rows, today],
  )

  const sel = invoiceMonthSummary(rows, month, today)
  const ovd = globalOverdue(rows, today)
  const max = Math.max(...totals.map((t) => t.s.total), 1)
  const paidPct = sel.total ? Math.round((sel.paidAmt / sel.total) * 100) : 0
  const allPaid = sel.nPend === 0 && sel.nPaid > 0

  return (
    <View className="mb-4 rounded-2xl bg-foreground p-4">
      <Text className="text-[10px] font-black uppercase tracking-widest text-background/60">
        A pagar em {monthLabel(month).split(' ')[0]}
        {month === current ? ' · mês atual' : ''}
      </Text>
      <Text className="my-1 text-3xl font-black tabular-nums text-background">{money(sel.due)}</Text>
      <Text className="text-xs text-background/80">
        {allPaid ? (
          <Text className="font-bold text-positive">✓ tudo pago neste mês</Text>
        ) : (
          <>
            {sel.nPend} {sel.nPend === 1 ? 'parcela em aberto' : 'parcelas em aberto'}
            {sel.nPaid ? (
              <Text className="font-bold text-positive"> · {money(sel.paidAmt)} já pagos ✓</Text>
            ) : null}
          </>
        )}
      </Text>
      {ovd.count ? (
        <Text className="mt-1 text-xs font-bold text-negative">
          ⚠ {ovd.count} {ovd.count === 1 ? 'parcela em atraso' : 'parcelas em atraso'} ·{' '}
          {money(ovd.amt)}
        </Text>
      ) : null}
      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/20">
        <View className="h-full rounded-full bg-positive" style={{ width: `${paidPct}%` }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        contentContainerStyle={{ gap: 6, alignItems: 'flex-end' }}
      >
        {totals.map(({ m, s }) => {
          const h = Math.max(Math.round((s.total / max) * BAR_H), 4)
          const paidH = s.total ? Math.round((s.paidAmt / s.total) * h) : 0
          const ovdH = s.total ? Math.round((s.overdue / s.total) * h) : 0
          const isSel = m === month
          return (
            <Pressable key={m} onPress={() => onMonthChange(m)} className="w-9 items-center">
              <View style={{ height: BAR_H, justifyContent: 'flex-end' }}>
                <View
                  className={`w-5 overflow-hidden rounded-t-md ${
                    isSel ? 'bg-background' : 'bg-background/25'
                  }`}
                  style={{ height: h }}
                >
                  <View
                    className="absolute inset-x-0 bottom-0 bg-positive"
                    style={{ height: paidH }}
                  />
                  <View
                    className="absolute inset-x-0 bg-negative"
                    style={{ bottom: paidH, height: ovdH }}
                  />
                </View>
              </View>
              <Text
                className={`mt-1 text-[9px] uppercase ${
                  isSel ? 'font-black text-background' : 'font-bold text-background/60'
                }`}
              >
                {shortMonth(m)}
                {m === current ? '·' : ''}
              </Text>
              <Text className="text-[8px] tabular-nums text-background/70">
                {s.total ? fmtK(s.total) : ''}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
