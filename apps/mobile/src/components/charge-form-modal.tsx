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

/** Formulário de nova cobrança como modal nativo (paridade com a web). */
export function ChargeFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils()
  const [draft, setDraft] = useState<InstallmentDraft>(emptyInstallmentDraft)
  const [error, setError] = useState<string | null>(null)

  const create = trpc.charges.create.useMutation({
    onSuccess: () => {
      utils.charges.invalidate()
      setDraft(emptyInstallmentDraft)
      onClose()
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  const set = (patch: Partial<InstallmentDraft>) => setDraft((d) => ({ ...d, ...patch }))

  function submit() {
    setError(null)
    if (!draft.name.trim()) return setError('Informe o campo devedor')
    const err = validateInstallmentDraft(draft)
    if (err) return setError(err)
    create.mutate({
      debtorName: draft.name.trim(),
      status: 'pendente',
      ...parseInstallmentDraft(draft),
    })
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
              Nova cobrança
            </Text>
            <Input label="Devedor" value={draft.name} onChangeText={(name) => set({ name })} />
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
              label="Já recebido (R$)"
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
              title={create.isPending ? 'Salvando…' : 'Salvar cobrança'}
              onPress={submit}
              disabled={create.isPending}
            />
            <View className="h-2" />
            <Button title="Cancelar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
