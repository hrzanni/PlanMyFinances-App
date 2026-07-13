import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatDate, installmentTotals, toNumber } from '@pmf/core'
import { money } from '@/lib/format'
import { Badge, Card, type BadgeTone } from './ui'

function statusTone(status: string): BadgeTone {
  if (status === 'pago') return 'paid'
  if (status === 'pendente') return 'pending'
  if (status === 'cobrado') return 'info'
  return 'neutral'
}

export interface InstallmentRow {
  id: string
  title: string
  description: string | null
  amountPerInstallment: string
  totalInstallments: number
  amountPaid: string
  dueDate: string | null
  status: string
}

/** Card de cobrança/fatura com totais calculados no @pmf/core (RN-003). */
export function InstallmentCard({
  row,
  statuses,
  onSetStatus,
  onDelete,
}: {
  row: InstallmentRow
  statuses: readonly string[]
  onSetStatus: (status: string) => void
  onDelete?: () => void
}) {
  const totals = installmentTotals(
    toNumber(row.amountPerInstallment),
    row.totalInstallments,
    toNumber(row.amountPaid),
  )
  return (
    <Card className="mb-3">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-sm font-bold text-foreground dark:text-foreground-dark">
          {row.title}
        </Text>
        <Badge tone={statusTone(row.status)} label={row.status} />
        {onDelete ? (
          <Pressable
            accessibilityLabel={`Excluir ${row.title}`}
            hitSlop={8}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color="#9C9B9B" />
          </Pressable>
        ) : null}
      </View>
      {row.description ? (
        <Text className="text-[11px] text-muted dark:text-muted-dark">{row.description}</Text>
      ) : null}
      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="text-xs text-body dark:text-body-dark">
          {money(row.amountPerInstallment)} ×{row.totalInstallments} = {money(totals.total)}
        </Text>
        <Text className="text-xs text-body dark:text-body-dark">
          pago <Text className="font-bold text-positive dark:text-positive-dark">{money(row.amountPaid)}</Text>
        </Text>
        <Text className="text-xs text-body dark:text-body-dark">
          resta <Text className="font-bold">{money(totals.remaining)}</Text>
        </Text>
        {row.dueDate ? (
          <Text className="text-xs text-muted dark:text-muted-dark">
            vence {formatDate(row.dueDate)}
          </Text>
        ) : null}
      </View>
      <View className="mt-2 flex-row gap-2">
        {statuses.map((s) => (
          <Pressable
            key={s}
            onPress={() => onSetStatus(s)}
            className={`rounded-full border px-3 py-1 ${
              row.status === s
                ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
                : 'border-line dark:border-line-dark'
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase ${
                row.status === s
                  ? 'text-background dark:text-background-dark'
                  : 'text-muted dark:text-muted-dark'
              }`}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  )
}
