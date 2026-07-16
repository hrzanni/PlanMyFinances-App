import { useEffect, useState } from 'react'
import { Modal, Text, View } from 'react-native'
import { Button, Input } from '@/components/ui'

interface FolderFormSheetProps {
  open: boolean
  onClose: () => void
  initialName?: string
  saving: boolean
  onSubmit: (name: string) => void
}

/** Bottom sheet única para criar e editar nome de pasta. */
export function FolderFormSheet({
  open,
  onClose,
  initialName = '',
  saving,
  onSubmit,
}: FolderFormSheetProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const editing = initialName !== ''

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
    }
  }, [open, initialName])

  function submit() {
    setError(null)
    if (!name.trim()) return setError('Informe o nome')
    onSubmit(name.trim())
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
            {editing ? 'Editar pasta' : 'Nova pasta'}
          </Text>
          <Input
            label="Nome"
            placeholder="Viagem Chile"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          {error ? (
            <Text className="mb-2 text-xs font-bold text-negative dark:text-negative-dark">
              {error}
            </Text>
          ) : null}
          <Button
            title={saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar pasta'}
            onPress={submit}
            disabled={saving}
          />
          <View className="h-2" />
          <Button title="Cancelar" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}
