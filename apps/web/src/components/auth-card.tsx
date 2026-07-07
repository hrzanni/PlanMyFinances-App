'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <div className={`font-black text-foreground ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
      Plan<span className="font-light text-muted">My</span>Finances
    </div>
  )
}

/** Envolve as telas de auth: usuário já autenticado é levado para a Home (FR-065). */
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && session) router.replace('/')
  }, [session, isPending, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-7">
        <Logo size="lg" />
        <p className="mb-5 mt-1 text-xs text-muted">{title}</p>
        {children}
      </div>
    </main>
  )
}
