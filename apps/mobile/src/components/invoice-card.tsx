import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { installmentForMonth } from '@pmf/core'
import { money } from '@/lib/format'
import { Badge, Card } from './ui'
import { Chevron, InstallmentsPanel } from './installments-panel'
import { rowInstallments, toSchedule, type InvoiceRow } from './invoice-derive'

function MonthBadge({ row, month, today }: { row: InvoiceRow; month: string; today: string }) {
  const n = installmentForMonth(toSchedule(row), month)
  if (!n) return <Badge tone="neutral" label="sem parcela" />
  const st = rowInstallments(row, today)[n - 1]!
  const day = Number(st.dueDate.slice(8, 10))
  if (st.paid) return <Badge tone="paid" label="paga ✓" />
  if (st.overdue) return <Badge tone="late" label={`venceu dia ${day}`} />
  return <Badge tone="pending" label={`vence dia ${day}`} />
}

/** Card de fatura ativa: badge do mês, mini-barra e expander de parcelas. */
export function InvoiceCard({
  row,
  month,
  today,
  expanded,
  onToggle,
  onOpenPayment,
  onDelete,
}: {
  row: InvoiceRow
  month: string
  today: string
  expanded: boolean
  onToggle: () => void
  onOpenPayment: (n: number) => void
  onDelete: () => void
}) {
  const installments = rowInstallments(row, today)
  const paidCount = installments.filter((s) => s.paid).length
  const total = row.totalInstallments
  const per = Number(row.amountPerInstallment)
  const remaining = per * (total - paidCount)
  const pct = total ? Math.round((paidCount / total) * 100) : 0

  return (
    <Card className="mb-3">
      <Pressable className="flex-row items-center gap-2" onPress={onToggle}>
        <Text className="flex-1 text-sm font-bold text-foreground dark:text-foreground-dark">
          {row.description || row.cardName}
        </Text>
        <MonthBadge row={row} month={month} today={today} />
        <Pressable accessibilityLabel="Excluir fatura" hitSlop={8} onPress={onDelete}>
          <Ionicons name="trash-outline" size={15} color="#9C9B9B" />
        </Pressable>
      </Pressable>

      <Text className="mt-1 text-[11px] tabular-nums text-muted dark:text-muted-dark">
        {paidCount}/{total} pagas · parcela de {money(per)} · resta {money(remaining)}
      </Text>
      <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <View className="h-full rounded-full bg-positive" style={{ width: `${pct}%` }} />
      </View>

      <Pressable
        className="mt-2 flex-row items-center gap-1.5"
        onPress={onToggle}
        accessibilityRole="button"
      >
        <Text className="text-[11px] font-bold text-muted dark:text-muted-dark">
          {expanded ? 'ocultar' : `ver ${total} parcelas`}
        </Text>
        <Chevron open={expanded} />
      </Pressable>

      {expanded ? (
        <InstallmentsPanel installments={installments} onOpenPayment={onOpenPayment} />
      ) : null}
    </Card>
  )
}
