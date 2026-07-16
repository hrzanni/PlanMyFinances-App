import { Pressable, Text, View } from 'react-native'
import {
  chargeEffectiveState,
  deriveChargeInstallments,
  formatDate,
  installmentTotals,
  nextUnpaidChargeInstallment,
  type ChargeEffectiveState,
} from '@pmf/core'
import { money } from '@/lib/format'
import { Badge, Card, type BadgeTone } from '@/components/ui'
import { InstallmentChips } from '@/components/installment-chips'
import { toChargeState, type ChargeRow } from './charge-adapt'

export type { ChargeRow } from './charge-adapt'

const stateTone: Record<ChargeEffectiveState, BadgeTone> = {
  pago: 'paid',
  atrasada: 'late',
  cobrado: 'info',
  pendente: 'pending',
}

/** Card de cobrança: resumo + preview de parcelas. Ações e mudança de status vivem no sheet de detalhe. */
export function ChargeCard({ row, today, onOpen }: { row: ChargeRow; today: string; onOpen: () => void }) {
  const charge = toChargeState(row)
  const state = chargeEffectiveState(charge, today)
  const totals = installmentTotals(
    charge.amountPerInstallment,
    charge.totalInstallments,
    charge.amountPaid,
  )
  const installments = deriveChargeInstallments(charge, today)
  const paidCount = installments?.filter((s) => s.paid).length ?? null
  const next = nextUnpaidChargeInstallment(charge, today)
  const dueLabel =
    totals.remaining <= 0
      ? 'quitada'
      : next
        ? `vence ${formatDate(next.dueDate)}`
        : row.dueDate
          ? `vence ${formatDate(row.dueDate)}`
          : null

  return (
    <Pressable accessibilityRole="button" onPress={onOpen}>
      <Card className="mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-sm font-bold text-foreground dark:text-foreground-dark">
            {row.debtorName}
          </Text>
          <Badge tone={stateTone[state]} label={state} />
        </View>
        {row.description ? (
          <Text className="text-[11px] text-muted dark:text-muted-dark">{row.description}</Text>
        ) : null}
        <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
          {paidCount !== null ? (
            <Text className="text-xs text-body dark:text-body-dark">
              {paidCount} de {charge.totalInstallments} parcelas
            </Text>
          ) : null}
          <Text className="text-xs text-body dark:text-body-dark">
            recebido{' '}
            <Text className="font-bold text-positive dark:text-positive-dark">
              {money(row.amountPaid)}
            </Text>
          </Text>
          <Text className="text-xs text-body dark:text-body-dark">
            resta <Text className="font-bold">{money(totals.remaining)}</Text>
          </Text>
        </View>
        {installments ? (
          <View className="mt-2">
            <InstallmentChips installments={installments} />
          </View>
        ) : null}
        {dueLabel ? (
          <Text className="mt-2 text-xs text-muted dark:text-muted-dark">{dueLabel}</Text>
        ) : null}
      </Card>
    </Pressable>
  )
}
