import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { trpc } from '@/lib/trpc'
import { signOut } from '@/lib/auth-client'
import { Button, Card, Input } from '@/components/ui'

function ProfileForm({ user }: { user: { name: string; email: string } }) {
  const utils = trpc.useUtils()
  const [name, setName] = useState(user.name)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const update = trpc.users.updateName.useMutation({
    onSuccess: () => {
      utils.users.invalidate()
      setFeedback({ ok: true, text: 'Nome atualizado.' })
    },
    onError: () => setFeedback({ ok: false, text: 'Erro ao salvar. Tente novamente.' }),
  })

  function submit() {
    setFeedback(null)
    if (!name.trim()) return setFeedback({ ok: false, text: 'Informe o nome' })
    update.mutate({ name: name.trim() })
  }

  return (
    <Card>
      <Input label="Nome" value={name} onChangeText={setName} maxLength={120} />
      <Input label="Email" value={user.email} editable={false} />
      <Text className="-mt-2 mb-3 text-[11px] text-muted dark:text-muted-dark">
        O email de login não pode ser alterado.
      </Text>
      {feedback ? (
        <Text
          className={`mb-2 text-xs font-bold ${
            feedback.ok
              ? 'text-positive dark:text-positive-dark'
              : 'text-negative dark:text-negative-dark'
          }`}
        >
          {feedback.text}
        </Text>
      ) : null}
      <Button title={update.isPending ? 'Salvando…' : 'Salvar'} onPress={submit} disabled={update.isPending} />
    </Card>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const me = trpc.users.me.useQuery()

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
      {me.data ? (
        <ProfileForm user={me.data} />
      ) : (
        <Text className="py-6 text-center text-xs text-muted dark:text-muted-dark">
          Carregando perfil…
        </Text>
      )}
      <View className="mt-6 items-center">
        <Pressable onPress={handleSignOut} accessibilityRole="button" className="py-2">
          <Text className="text-sm font-bold text-negative dark:text-negative-dark">Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
