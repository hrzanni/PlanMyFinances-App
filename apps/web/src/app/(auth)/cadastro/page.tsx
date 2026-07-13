'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Field, Input, Label } from '@pmf/ui-web'
import { signUp } from '@/lib/auth-client'
import { AuthCard } from '@/components/auth-card'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('A senha precisa ter ao menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await signUp.email({ name, email, password })
      if (err) {
        setError(err.message === 'User already exists' ? 'Este email já está cadastrado' : 'Não foi possível criar a conta')
        return
      }
      router.replace('/')
    } catch {
      setError('Não foi possível conectar ao servidor. Aguarde alguns segundos e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Crie sua conta">
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field>
          <Label htmlFor="password">Senha (mínimo 8 caracteres)</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
      <div className="mt-4 text-center text-xs">
        <Link href="/login" className="text-info hover:underline">
          Já tenho conta — entrar
        </Link>
      </div>
    </AuthCard>
  )
}
