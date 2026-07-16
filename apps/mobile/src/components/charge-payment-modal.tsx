import { useEffect, useState } from 'react'
import { Modal, ScrollView, Text, View } from 'react-native'
import { applyChargePayment, installmentTotals, toNumber } from '@pmf/core'
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

/** Registrar recebimento parcial de cobrança (fase 8.1); histórico vive em ChargePaymentHistory. */
export function ChargePaymentModal({
  charge,
  initialAmount,
  installmentLabel,
  onClose,
}: {
  charge: ChargePaymentTarget | null
  initialAmount?: number
  installmentLabel?: string
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const open = charge !== null
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

  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount(initialAmount ? String(initialAmount) : '')
      setError(null)
    }
  }, [open, charge?.id, initialAmount])

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
            {installmentLabel ? (
              <Text className="mb-1 text-xs font-bold text-muted dark:text-muted-dark">
                {installmentLabel}
              </Text>
            ) : null}
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
            <View className="h-2" />
            <Button title="Fechar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
