'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Field, Input, Label, LoadingState } from '@pmf/ui-web'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { signOut } from '@/lib/auth-client'
import { PageHeader } from '@/components/page-header'

type Me = RouterOutputs['users']['me']

function ProfileForm({ user }: { user: Me }) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    if (!name.trim()) return setFeedback({ ok: false, text: 'Informe o nome' })
    update.mutate({ name: name.trim() })
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
        <ProfileForm user={me.data} />
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
