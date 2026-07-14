import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import {
  emptyInvoiceDraft,
  parseInvoiceDraft,
  validateInvoiceDraft,
  type InvoiceDraft,
} from '@pmf/core'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active
          ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
          : 'border-line dark:border-line-dark'
      }`}
    >
      <Text
        className={`text-xs font-bold ${
          active
            ? 'text-background dark:text-background-dark'
            : 'text-body dark:text-body-dark'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}

/** Formulário de nova fatura v2 (parcela + primeiro vencimento + categoria) como modal nativo. */
export function InvoiceFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils()
  const { data: cards } = trpc.cards.list.useQuery(undefined, { enabled: open })
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open })
  const expenseCats = useMemo(
    () => (categories ?? []).filter((c) => c.type === 'despesa'),
    [categories],
  )
  const [draft, setDraft] = useState<InvoiceDraft>(emptyInvoiceDraft)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<InvoiceDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const create = trpc.invoices.create.useMutation({
    onSuccess: () => {
      utils.invoices.invalidate()
      setDraft(emptyInvoiceDraft)
      onClose()
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function selectCard(id: string) {
    const card = (cards ?? []).find((c) => c.id === id)
    set({ cardId: id, name: card ? card.name : draft.name })
  }

  function submit() {
    setError(null)
    if (!draft.name.trim()) return setError('Informe o campo cartão')
    const err = validateInvoiceDraft(draft)
    if (err) return setError(err)
    create.mutate({ cardName: draft.name.trim(), status: 'pendente', ...parseInvoiceDraft(draft) })
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
              Nova fatura
            </Text>

            {(cards ?? []).length > 0 ? (
              <>
                <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
                  Cartão cadastrado (opcional)
                </Text>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  <Chip active={draft.cardId === ''} label="Nenhum" onPress={() => set({ cardId: '' })} />
                  {(cards ?? []).map((c) => (
                    <Chip
                      key={c.id}
                      active={draft.cardId === c.id}
                      label={c.name}
                      onPress={() => selectCard(c.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Input label="Cartão" value={draft.name} onChangeText={(name) => set({ name })} />
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
              label="Primeiro vencimento (AAAA-MM-DD)"
              value={draft.firstDueDate}
              onChangeText={(firstDueDate) => set({ firstDueDate })}
            />

            <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
              Categoria (opcional)
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              <Chip
                active={draft.categoryId === ''}
                label="Nenhuma"
                onPress={() => set({ categoryId: '' })}
              />
              {expenseCats.map((c) => (
                <Chip
                  key={c.id}
                  active={draft.categoryId === c.id}
                  label={c.name}
                  onPress={() => set({ categoryId: c.id })}
                />
              ))}
            </View>

            {error ? (
              <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={create.isPending ? 'Salvando…' : 'Salvar fatura'}
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
