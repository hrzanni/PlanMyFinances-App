import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { formatDate } from '@pmf/core'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { rowInstallments } from './invoice-derive'

export interface PaymentTarget {
  invoiceId: string
  installmentNumber: number
}

export interface PaymentToast {
  text: string
  detail: string
  paymentId: string
}

type PaidStatus = 'paga' | 'pendente'
const toComma = (n: number) => n.toFixed(2).replace('.', ',')
const parseAmount = (v: string) => Number(v.replace(',', '.'))

/** Bottom-sheet de pagamento de parcela; alvo derivado do cache (paridade com a web). */
export function InstallmentPaymentModal({
  target,
  onClose,
  onPaid,
}: {
  target: PaymentTarget | null
  onClose: () => void
  onPaid: (toast: PaymentToast) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const utils = trpc.useUtils()
  const list = trpc.invoices.list.useQuery()
  const row = target ? (list.data?.find((r) => r.id === target.invoiceId) ?? null) : null
  const st = row && target ? rowInstallments(row, today)[target.installmentNumber - 1] : undefined
  const per = row ? Number(row.amountPerInstallment) : 0

  const [status, setStatus] = useState<PaidStatus>('paga')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!target || !st) return
    const payment = row?.payments.find((p) => p.installmentNumber === target.installmentNumber)
    setStatus('paga')
    setAmount(toComma(st.paid ? (st.amountPaid ?? per) : per))
    setPaidOn(payment ? String(payment.paidOn).slice(0, 10) : today)
    setError(null)
    // reidrata só quando o alvo muda (valores vêm do cache naquele momento)
  }, [target?.invoiceId, target?.installmentNumber])

  const invalidate = () => {
    utils.invoices.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
    // a despesa gerada/removida muda o txCount dos chips de cartão
    utils.cards.invalidate()
  }
  const register = trpc.invoices.registerPayment.useMutation({
    onSuccess: ({ payment, transaction }) => {
      invalidate()
      onPaid({
        text: 'Despesa criada no Histórico',
        detail: `${money(transaction.value)} · "${transaction.description}" · ${row?.categoryName ?? 'sem categoria'} · ${row?.cardName ?? ''} · ${formatDate(String(transaction.date).slice(0, 10))}`,
        paymentId: payment.id,
      })
      onClose()
    },
    onError: (e) => setError(e.message),
  })
  const update = trpc.invoices.updatePayment.useMutation({
    onSuccess: () => {
      invalidate()
      onClose()
    },
    onError: (e) => setError(e.message),
  })
  const unregister = trpc.invoices.unregisterPayment.useMutation({ onSuccess: invalidate })

  function submit() {
    if (!row || !target || !st) return
    if (status === 'pendente') {
      // fecha na hora (como a web); a invalidação atualiza a lista quando o mutate resolver
      if (st.paymentId) unregister.mutate({ paymentId: st.paymentId })
      onClose()
      return
    }
    const value = parseAmount(amount)
    if (!value || value <= 0) return setError('Informe o valor pago')
    setError(null)
    if (st.paid && st.paymentId) {
      update.mutate({ paymentId: st.paymentId, amount: value, paidOn })
    } else {
      register.mutate({
        id: row.id,
        installmentNumber: target.installmentNumber,
        amount: value,
        paidOn,
      })
    }
  }

  const pending = register.isPending || update.isPending || unregister.isPending
  const value = parseAmount(amount) || per
  const seg = (s: PaidStatus, label: string) => (
    <Pressable
      onPress={() => setStatus(s)}
      className={`flex-1 items-center py-2.5 ${
        status === s ? 'bg-foreground dark:bg-foreground-dark' : ''
      }`}
    >
      <Text
        className={`text-xs font-bold ${
          status === s
            ? 'text-background dark:text-background-dark'
            : 'text-muted dark:text-muted-dark'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )

  return (
    <Modal visible={target !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          {row && st && target ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text className="text-base font-black text-foreground dark:text-foreground-dark">
                Parcela {target.installmentNumber} de {row.totalInstallments} ·{' '}
                {row.description || row.cardName}
              </Text>
              <Text className="mb-4 mt-1 text-xs text-muted dark:text-muted-dark">
                Vencimento {formatDate(st.dueDate)}
                {st.overdue ? (
                  <Text className="font-bold text-negative dark:text-negative-dark"> · em atraso</Text>
                ) : null}
              </Text>

              <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
                Status
              </Text>
              <View className="mb-3 flex-row overflow-hidden rounded-lg border border-line dark:border-line-dark">
                {seg('paga', 'Paga')}
                {seg('pendente', 'Pendente')}
              </View>

              {status === 'paga' ? (
                <>
                  <Input
                    label="Valor pago (R$)"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <Input
                    label="Data do pagamento (AAAA-MM-DD)"
                    value={paidOn}
                    onChangeText={setPaidOn}
                  />
                  <View className="mb-3 rounded-xl border border-positive/25 bg-positive/10 px-3 py-2.5">
                    <Text className="text-[11px] leading-relaxed text-body dark:text-body-dark">
                      <Text className="font-black text-positive dark:text-positive-dark">↳ </Text>
                      Ao salvar, uma{' '}
                      <Text className="font-bold text-foreground dark:text-foreground-dark">
                        despesa de {money(value)}
                      </Text>{' '}
                      {st.paid ? 'será atualizada' : 'será criada'} no Histórico: "
                      {row.description || row.cardName} — parcela {target.installmentNumber}/
                      {row.totalInstallments}" · categoria{' '}
                      <Text className="font-bold text-positive dark:text-positive-dark">
                        {row.categoryName ?? 'sem categoria'}
                      </Text>{' '}
                      · cartão{' '}
                      <Text className="font-bold text-foreground dark:text-foreground-dark">
                        {row.cardName}
                      </Text>
                      .
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="mb-3 text-[11px] text-muted dark:text-muted-dark">
                  {st.paid
                    ? 'Ao salvar, o pagamento e a despesa vinculada serão removidos.'
                    : 'Esta parcela ainda não foi paga.'}
                </Text>
              )}

              {error ? (
                <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                  {error}
                </Text>
              ) : null}
              <Button
                title={
                  pending ? 'Salvando…' : status === 'pendente' ? 'Salvar' : st.paid ? 'Salvar' : 'Marcar como paga'
                }
                onPress={submit}
                disabled={pending}
              />
              <View className="h-2" />
              <Button title="Cancelar" variant="ghost" onPress={onClose} />
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}
