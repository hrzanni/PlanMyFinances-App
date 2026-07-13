import { useState } from 'react'
import { Modal, ScrollView, Text, View } from 'react-native'
import {
  emptyInstallmentDraft,
  parseInstallmentDraft,
  validateInstallmentDraft,
  type InstallmentDraft,
} from '@pmf/core'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'

const labels = {
  charge: { title: 'Nova cobrança', name: 'Devedor', save: 'Salvar cobrança' },
  invoice: { title: 'Nova fatura', name: 'Cartão', save: 'Salvar fatura' },
} as const

/** Formulário de nova cobrança/fatura como modal nativo (paridade com a web). */
export function InstallmentFormModal({
  open,
  onClose,
  kind,
}: {
  open: boolean
  onClose: () => void
  kind: 'charge' | 'invoice'
}) {
  const utils = trpc.useUtils()
  const [draft, setDraft] = useState<InstallmentDraft>(emptyInstallmentDraft)
  const [error, setError] = useState<string | null>(null)

  const onSuccess = () => {
    utils.charges.invalidate()
    utils.invoices.invalidate()
    setDraft(emptyInstallmentDraft)
    onClose()
  }
  const onError = () => setError('Erro ao salvar. Tente novamente.')
  const createCharge = trpc.charges.create.useMutation({ onSuccess, onError })
  const createInvoice = trpc.invoices.create.useMutation({ onSuccess, onError })
  const isPending = createCharge.isPending || createInvoice.isPending

  const set = (patch: Partial<InstallmentDraft>) => setDraft((d) => ({ ...d, ...patch }))

  function submit() {
    setError(null)
    if (!draft.name.trim()) return setError(`Informe o campo ${labels[kind].name.toLowerCase()}`)
    const err = validateInstallmentDraft(draft)
    if (err) return setError(err)
    const parsed = parseInstallmentDraft(draft)
    if (kind === 'charge') {
      createCharge.mutate({ debtorName: draft.name.trim(), status: 'pendente', ...parsed })
    } else {
      createInvoice.mutate({ cardName: draft.name.trim(), status: 'pendente', ...parsed })
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
              {labels[kind].title}
            </Text>
            <Input
              label={labels[kind].name}
              value={draft.name}
              onChangeText={(name) => set({ name })}
            />
            <Input
              label="Descrição (opcional)"
              value={draft.description}
              onChangeText={(description) => set({ description })}
            />
            <Input
              label="Valor da parcela (R$)"
              keyboardType="decimal-pad"
              value={draft.amountPerInstallment}
              onChangeText={(amountPerInstallment) => set({ amountPerInstallment })}
            />
            <Input
              label="Parcelas"
              keyboardType="number-pad"
              value={draft.totalInstallments}
              onChangeText={(totalInstallments) => set({ totalInstallments })}
            />
            <Input
              label="Já pago/recebido (R$)"
              keyboardType="decimal-pad"
              value={draft.amountPaid}
              onChangeText={(amountPaid) => set({ amountPaid })}
            />
            <Input
              label="Vencimento (AAAA-MM-DD, opcional)"
              value={draft.dueDate}
              onChangeText={(dueDate) => set({ dueDate })}
            />
            {error ? (
              <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={isPending ? 'Salvando…' : labels[kind].save}
              onPress={submit}
              disabled={isPending}
            />
            <View className="h-2" />
            <Button title="Cancelar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
