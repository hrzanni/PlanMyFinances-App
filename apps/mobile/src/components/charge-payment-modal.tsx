import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { applyChargePayment, formatDate, installmentTotals, toNumber } from '@pmf/core'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'

export interface ChargePaymentTarget {
  id: string
  debtorName: string
  amountPerInstallment: string
  totalInstallments: number
  amountPaid: string
}

/** Registrar recebimento parcial de cobrança + histórico com desfazer (fase 8.1). */
export function ChargePaymentModal({
  charge,
  onClose,
}: {
  charge: ChargePaymentTarget | null
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const open = charge !== null
  const payments = trpc.charges.payments.useQuery({ id: charge?.id ?? '' }, { enabled: open })
  const invalidate = () => {
    utils.charges.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const register = trpc.charges.registerPayment.useMutation({
    onSuccess: () => {
      invalidate()
      setAmount('')
      setError(null)
    },
    onError: (err) => setError(err.message),
  })
  const unregister = trpc.charges.unregisterPayment.useMutation({ onSuccess: invalidate })

  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!charge) return null

  const totals = installmentTotals(
    toNumber(charge.amountPerInstallment),
    charge.totalInstallments,
    toNumber(charge.amountPaid),
  )

  function submit() {
    if (!charge) return
    const value = Number(amount.replace(',', '.'))
    if (!value || value <= 0) return setError('Informe o valor recebido')
    const applied = applyChargePayment(
      toNumber(charge.amountPerInstallment),
      charge.totalInstallments,
      toNumber(charge.amountPaid),
      value,
    )
    if (!applied) return setError('Valor recebido não pode exceder o restante')
    setError(null)
    register.mutate({ id: charge.id, amount: value })
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-1 text-base font-black text-foreground dark:text-foreground-dark">
              Recebimento de {charge.debtorName}
            </Text>
            <Text className="mb-4 text-xs text-muted dark:text-muted-dark">
              Recebido {money(charge.amountPaid)} de {money(totals.total)} · resta{' '}
              {money(totals.remaining)}
            </Text>
            <Input
              label="Valor recebido agora (R$)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            {error ? (
              <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={register.isPending ? 'Registrando…' : 'Registrar recebimento'}
              onPress={submit}
              disabled={register.isPending || totals.remaining <= 0}
            />
            {payments.data && payments.data.length > 0 ? (
              <View className="mt-4 border-t border-line pt-3 dark:border-line-dark">
                <Text className="mb-2 text-xs font-bold text-muted dark:text-muted-dark">
                  Histórico de recebimentos
                </Text>
                {payments.data.map((p) => (
                  <View key={p.id} className="mb-1 flex-row items-center justify-between">
                    <Text className="text-xs text-body dark:text-body-dark">
                      {formatDate(String(p.createdAt).slice(0, 10))} ·{' '}
                      <Text className="font-bold text-positive dark:text-positive-dark">
                        {money(p.amount)}
                      </Text>
                    </Text>
                    <Pressable
                      hitSlop={8}
                      disabled={unregister.isPending}
                      onPress={() => unregister.mutate({ paymentId: p.id })}
                    >
                      <Text className="text-xs text-muted underline dark:text-muted-dark">
                        desfazer
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <View className="h-2" />
            <Button title="Fechar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
