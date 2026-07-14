import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { BANK_PRESETS, bankPresetInfo, type BankPresetKey } from '@pmf/core'
import { Button, Input } from './ui'
import { BankLogo } from './bank-logo'
import { trpc, type RouterOutputs } from '@/lib/trpc'

export type CardItem = RouterOutputs['cards']['list'][number]

/** Criar/editar cartão com seleção de banco preset e logo (fase 8.2). */
export function CardFormModal({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing: CardItem | null
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [name, setName] = useState('')
  const [preset, setPreset] = useState<BankPresetKey>('nubank')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setPreset((editing?.bankPreset as BankPresetKey) ?? 'nubank')
      setError(null)
    }
  }, [open, editing])

  const onSuccess = () => {
    utils.cards.invalidate()
    onClose()
  }
  const onError = () => setError('Erro ao salvar. Tente novamente.')
  const create = trpc.cards.create.useMutation({ onSuccess, onError })
  const update = trpc.cards.update.useMutation({ onSuccess, onError })
  const isPending = create.isPending || update.isPending

  function selectPreset(key: BankPresetKey) {
    setPreset(key)
    if (!name.trim() || BANK_PRESETS.some((b) => b.label === name)) {
      setName(key === 'outro' ? '' : bankPresetInfo(key).label)
    }
  }

  function submit() {
    setError(null)
    if (!name.trim()) return setError('Informe o nome do cartão')
    if (editing) {
      update.mutate({ id: editing.id, name: name.trim(), bankPreset: preset })
    } else {
      create.mutate({ name: name.trim(), bankPreset: preset })
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
              {editing ? 'Editar cartão' : 'Novo cartão'}
            </Text>
            <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
              Banco
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {BANK_PRESETS.map((bank) => (
                <Pressable
                  key={bank.key}
                  onPress={() => selectPreset(bank.key)}
                  className={`flex-row items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                    preset === bank.key
                      ? 'border-foreground dark:border-foreground-dark'
                      : 'border-line dark:border-line-dark'
                  }`}
                >
                  <BankLogo preset={bank.key} size={20} />
                  <Text
                    className={`text-xs font-bold ${
                      preset === bank.key
                        ? 'text-foreground dark:text-foreground-dark'
                        : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    {bank.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input label="Nome do cartão" value={name} onChangeText={setName} />
            {error ? (
              <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={isPending ? 'Salvando…' : editing ? 'Salvar cartão' : 'Criar cartão'}
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
