import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { deriveChargeInstallments, installmentTotals, toNumber } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { confirmDelete } from '@/lib/confirm'
import { Button } from '@/components/ui'
import { InstallmentsPanel } from '@/components/installments-panel'
import { ChargePaymentModal } from '@/components/charge-payment-modal'
import { toChargeState, type ChargeRow } from './charge-adapt'
import { ChargePaymentHistory } from './charge-payment-history'

const statuses = ['pendente', 'cobrado', 'pago'] as const

interface ChargeDetailSheetProps {
  charge: ChargeRow | null
  today: string
  onClose: () => void
  onEdit: (charge: ChargeRow) => void
}

/** Bottom sheet de detalhe: ações, status, cronograma e histórico de uma cobrança. */
export function ChargeDetailSheet({ charge, today, onClose, onEdit }: ChargeDetailSheetProps) {
  const utils = trpc.useUtils()
  const setStatus = trpc.charges.setStatus.useMutation({ onSuccess: () => utils.charges.invalidate() })
  const del = trpc.charges.delete.useMutation({
    onSuccess: () => {
      utils.charges.invalidate()
      onClose()
    },
  })
  const [payment, setPayment] = useState<{ amount?: number; label?: string } | null>(null)

  if (!charge) return null

  const state = toChargeState(charge)
  const per = state.amountPerInstallment
  const totals = installmentTotals(per, charge.totalInstallments, toNumber(charge.amountPaid))
  const installments = deriveChargeInstallments(state, today)

  return (
    <>
      <Modal visible={charge !== null} animationType="slide" transparent onRequestClose={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="mb-1 flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-lg font-black text-foreground dark:text-foreground-dark">
                  {charge.debtorName}
                </Text>
                <View className="flex-row items-center gap-4 pt-1">
                  <Pressable accessibilityLabel="Editar cobrança" hitSlop={8} onPress={() => onEdit(charge)}>
                    <Ionicons name="create-outline" size={18} color="#9C9B9B" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Excluir cobrança"
                    hitSlop={8}
                    onPress={() =>
                      confirmDelete(
                        'Excluir cobrança',
                        `Excluir a cobrança de "${charge.debtorName}"?`,
                        () => del.mutate({ id: charge.id }),
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color="#9C9B9B" />
                  </Pressable>
                </View>
              </View>
              {charge.description ? (
                <Text className="mb-2 text-xs text-muted dark:text-muted-dark">
                  {charge.description}
                </Text>
              ) : null}
              <Text className="mb-3 text-2xl font-black tabular-nums text-foreground dark:text-foreground-dark">
                {money(totals.total)}
              </Text>
              <Text className="mb-3 text-xs text-body dark:text-body-dark">
                recebido{' '}
                <Text className="font-bold text-positive dark:text-positive-dark">
                  {money(charge.amountPaid)}
                </Text>{' '}
                · resta <Text className="font-bold">{money(totals.remaining)}</Text>
              </Text>

              <View className="mb-4 flex-row flex-wrap gap-2">
                {statuses.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus.mutate({ id: charge.id, status: s })}
                    className={`rounded-full border px-3 py-1 ${
                      charge.status === s
                        ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
                        : 'border-line dark:border-line-dark'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        charge.status === s
                          ? 'text-background dark:text-background-dark'
                          : 'text-muted dark:text-muted-dark'
                      }`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {installments ? (
                <InstallmentsPanel
                  installments={installments}
                  onOpenPayment={(n) => setPayment({ amount: per, label: `Parcela ${n}` })}
                />
              ) : (
                <Text className="mb-2 text-xs text-muted dark:text-muted-dark">
                  Sem vencimento cadastrado: acompanhe o total recebido acima.
                </Text>
              )}

              <View className="mt-4">
                <Button
                  title="Registrar recebimento"
                  onPress={() => setPayment({})}
                  disabled={totals.remaining <= 0}
                />
              </View>

              <ChargePaymentHistory chargeId={charge.id} />

              <View className="h-2" />
              <Button title="Fechar" variant="ghost" onPress={onClose} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ChargePaymentModal
        charge={payment ? charge : null}
        initialAmount={payment?.amount}
        installmentLabel={payment?.label}
        onClose={() => setPayment(null)}
      />
    </>
  )
}
