'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Field, Input, Label } from '@pmf/ui-web'
import { authClient } from '@/lib/auth-client'
import { AuthCard } from '@/components/auth-card'

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setError('Link inválido ou expirado. Solicite um novo.')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await authClient.resetPassword({ newPassword: password, token })
      if (err) {
        setError('Link inválido ou expirado. Solicite um novo.')
        return
      }
      router.replace('/login')
    } catch {
      setError('Não foi possível conectar ao servidor. Aguarde alguns segundos e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor="password">Nova senha (mínimo 8 caracteres)</Label>
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
        {loading ? 'Salvando…' : 'Redefinir senha'}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Defina sua nova senha">
      <Suspense>
        <ResetForm />
      </Suspense>
      <div className="mt-4 text-center text-xs">
        <Link href="/login" className="text-info hover:underline">
          Voltar para o login
        </Link>
      </div>
    </AuthCard>
  )
}
