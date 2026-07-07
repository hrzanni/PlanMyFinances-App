'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Field, Input, Label } from '@pmf/ui-web'
import { signIn } from '@/lib/auth-client'
import { AuthCard } from '@/components/auth-card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signIn.email({ email, password })
    setLoading(false)
    if (err) {
      setError('Email ou senha inválidos')
      return
    }
    router.replace('/')
  }

  return (
    <AuthCard title="Entre para continuar">
      <form onSubmit={handleSubmit}>
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
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-xs">
        <Link href="/esqueci-senha" className="text-info hover:underline">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-info hover:underline">
          Criar conta
        </Link>
      </div>
    </AuthCard>
  )
}
