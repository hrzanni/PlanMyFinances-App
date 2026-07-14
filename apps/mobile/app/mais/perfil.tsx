import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { initials } from '@pmf/core'
import { birthDateSchema, phoneSchema, type Gender } from '@pmf/schemas'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { signOut } from '@/lib/auth-client'
import { Button, Card, Input } from '@/components/ui'
import { GenderChips } from '@/components/gender-chips'

type Me = RouterOutputs['users']['me']

function ProfileHeader({ user }: { user: Me }) {
  return (
    <Card className="mb-3">
      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-navy dark:bg-navy-dark">
          <Text className="text-xl font-black text-white dark:text-background-dark">
            {initials(user.name) || '?'}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="text-base font-black text-foreground dark:text-foreground-dark"
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>
    </Card>
  )
}

function ProfileForm({ user }: { user: Me }) {
  const utils = trpc.useUtils()
  const [name, setName] = useState(user.name)
  const [birthDate, setBirthDate] = useState(user.birthDate ?? '')
  const [gender, setGender] = useState<Gender | ''>((user.gender as Gender | null) ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const update = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.invalidate()
      setFeedback({ ok: true, text: 'Perfil atualizado.' })
    },
    onError: () => setFeedback({ ok: false, text: 'Erro ao salvar. Tente novamente.' }),
  })

  function submit() {
    setFeedback(null)
    if (!name.trim()) return setFeedback({ ok: false, text: 'Informe o nome' })
    if (birthDate && !birthDateSchema.safeParse(birthDate).success)
      return setFeedback({ ok: false, text: 'Data de nascimento inválida (use AAAA-MM-DD)' })
    if (phone && !phoneSchema.safeParse(phone).success)
      return setFeedback({ ok: false, text: 'Telefone inválido' })
    update.mutate({
      name: name.trim(),
      birthDate: birthDate || null,
      gender: gender || null,
      phone: phone.trim() || null,
    })
  }

  return (
    <Card>
      <Input label="Nome" value={name} onChangeText={setName} maxLength={120} />
      <Input label="Email" value={user.email} editable={false} />
      <Text className="-mt-2 mb-3 text-[11px] text-muted dark:text-muted-dark">
        O email de login não pode ser alterado.
      </Text>
      <Input
        label="Data de nascimento (AAAA-MM-DD)"
        placeholder="1990-05-20"
        keyboardType="numbers-and-punctuation"
        value={birthDate}
        onChangeText={setBirthDate}
      />
      <GenderChips value={gender} onChange={setGender} />
      <Input
        label="Telefone"
        placeholder="+55 11 91234-5678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
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
      <Button
        title={update.isPending ? 'Salvando…' : 'Salvar'}
        onPress={submit}
        disabled={update.isPending}
      />
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
        <>
          <ProfileHeader user={me.data} />
          <ProfileForm user={me.data} />
        </>
      ) : (
        <Text className="py-6 text-center text-xs text-muted dark:text-muted-dark">
          Carregando perfil…
        </Text>
      )}
      <View className="mt-6 items-center pb-8">
        <Pressable onPress={handleSignOut} accessibilityRole="button" className="py-2">
          <Text className="text-sm font-bold text-negative dark:text-negative-dark">Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
