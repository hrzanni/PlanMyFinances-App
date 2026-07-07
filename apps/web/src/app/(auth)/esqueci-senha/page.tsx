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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await authClient.requestPasswordReset({ email, redirectTo: '/redefinir-senha' })
    setLoading(false)
    setSent(true)
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
