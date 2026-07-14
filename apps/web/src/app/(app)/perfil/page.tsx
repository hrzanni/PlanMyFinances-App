'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initials } from '@pmf/core'
import { phoneSchema, type Gender } from '@pmf/schemas'
import { Button, Card, Field, Input, Label, LoadingState, Select } from '@pmf/ui-web'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { signOut } from '@/lib/auth-client'
import { PageHeader } from '@/components/page-header'
import { GENDER_OPTIONS } from '@/lib/profile-fields'

type Me = RouterOutputs['users']['me']

const today = () => new Date().toISOString().slice(0, 10)

function ProfileForm({ user }: { user: Me }) {
  const utils = trpc.useUtils()
  const [name, setName] = useState(user.name)
  const [birthDate, setBirthDate] = useState(user.birthDate ?? '')
  const [gender, setGender] = useState(user.gender ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const update = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.invalidate()
      setFeedback({ ok: true, text: 'Perfil atualizado.' })
    },
    onError: () => setFeedback({ ok: false, text: 'Erro ao salvar. Tente novamente.' }),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    if (!name.trim()) return setFeedback({ ok: false, text: 'Informe o nome' })
    if (phone && !phoneSchema.safeParse(phone).success)
      return setFeedback({ ok: false, text: 'Telefone inválido' })
    update.mutate({
      name: name.trim(),
      birthDate: birthDate || null,
      gender: gender ? (gender as Gender) : null,
      phone: phone.trim() || null,
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field>
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user.email} readOnly disabled />
          <p className="mt-1 text-[11px] text-muted">O email de login não pode ser alterado.</p>
        </Field>
        <Field>
          <Label htmlFor="profile-birth-date">Data de nascimento</Label>
          <Input
            id="profile-birth-date"
            type="date"
            min="1900-01-01"
            max={today()}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="profile-gender">Gênero</Label>
          <Select
            id="profile-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Não informado</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="profile-phone">Telefone</Label>
          <Input
            id="profile-phone"
            type="tel"
            placeholder="+55 11 91234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        {feedback ? (
          <p
            className={`mb-3 text-xs font-bold ${feedback.ok ? 'text-positive' : 'text-negative'}`}
          >
            {feedback.text}
          </p>
        ) : null}
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </Card>
  )
}

function ProfileHeader({ user }: { user: Me }) {
  return (
    <Card className="mb-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy text-xl font-black text-white">
          {initials(user.name) || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-black text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </div>
    </Card>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const me = trpc.users.me.useQuery()

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      router.replace('/login')
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Perfil" subtitle="Seus dados de conta" />
      {me.data ? (
        <>
          <ProfileHeader user={me.data} />
          <ProfileForm user={me.data} />
        </>
      ) : (
        <LoadingState label="Carregando perfil…" />
      )}
      <div className="mt-4">
        <Button variant="ghost" onClick={handleSignOut}>
          Sair
        </Button>
      </div>
    </div>
  )
}
