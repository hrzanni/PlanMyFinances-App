import { useEffect, useState } from 'react'
import { Modal, ScrollView, Text, View } from 'react-native'
import {
  emptyInstallmentDraft,
  parseInstallmentDraft,
  validateInstallmentDraft,
  type InstallmentDraft,
} from '@pmf/core'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'
import type { ChargeRow } from './charges/charge-card'

function draftFromRow(row: ChargeRow): InstallmentDraft {
  return {
    name: row.debtorName,
    description: row.description ?? '',
    amountPerInstallment: row.amountPerInstallment,
    totalInstallments: String(row.totalInstallments),
    amountPaid: row.amountPaid,
    dueDate: row.dueDate ?? '',
  }
}

/** Criar/editar cobrança como modal nativo (paridade com a web); status muda só pelas pills do sheet. */
export function ChargeFormModal({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing?: ChargeRow | null
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [draft, setDraft] = useState<InstallmentDraft>(emptyInstallmentDraft)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(editing ? draftFromRow(editing) : emptyInstallmentDraft)
      setError(null)
    }
  }, [open, editing])

  const onSuccess = () => {
    utils.charges.invalidate()
    onClose()
  }
  const onError = () => setError('Erro ao salvar. Tente novamente.')
  const create = trpc.charges.create.useMutation({ onSuccess, onError })
  const update = trpc.charges.update.useMutation({ onSuccess, onError })
  const isPending = create.isPending || update.isPending

  const set = (patch: Partial<InstallmentDraft>) => setDraft((d) => ({ ...d, ...patch }))

  function submit() {
    setError(null)
    if (!draft.name.trim()) return setError('Informe o campo devedor')
    const err = validateInstallmentDraft(draft)
    if (err) return setError(err)
    if (editing) {
      update.mutate({
        id: editing.id,
        debtorName: draft.name.trim(),
        status: editing.status as 'pendente' | 'cobrado' | 'pago',
        ...parseInstallmentDraft(draft),
      })
    } else {
      create.mutate({
        debtorName: draft.name.trim(),
        status: 'pendente',
        ...parseInstallmentDraft(draft),
      })
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
              {editing ? 'Editar cobrança' : 'Nova cobrança'}
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
              title={isPending ? 'Salvando…' : 'Salvar cobrança'}
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
