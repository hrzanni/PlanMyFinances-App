'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Field, Input, Label } from '@pmf/ui-web'
import { authClient } from '@/lib/auth-client'
import { AuthCard } from '@/components/auth-card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/redefinir-senha',
      })
      if (err) setError('Não foi possível enviar o link. Tente novamente.')
      else setSent(true)
    } catch {
      setError('Não foi possível enviar o link. Verifique a conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Recuperar senha">
      {sent ? (
        <p className="text-sm text-body">
          Se existir uma conta com este email, você receberá um link para redefinir a senha. O link
          expira em 1 hora.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando…' : 'Enviar link de recuperação'}
          </Button>
        </form>
      )}
      <div className="mt-4 text-center text-xs">
        <Link href="/login" className="text-info hover:underline">
          Voltar para o login
        </Link>
      </div>
    </AuthCard>
  )
}
