'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { signOut, useSession } from '@/lib/auth-client'

/** Rodapé da navegação (tema, email, sair) — usado na Sidebar e no MobileNav. */
export function NavFooter() {
  const router = useRouter()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      router.replace('/login')
    }
  }

  return (
    <div className="mt-auto space-y-2 border-t border-white/10 px-5 pt-3">
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="text-xs text-neutral-400 hover:text-white"
      >
        {mounted && resolvedTheme === 'dark' ? '◐ Tema claro' : '◑ Tema escuro'}
      </button>
      <div className="truncate text-xs text-neutral-500">{session?.user.email}</div>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-xs font-bold text-neutral-400 hover:text-white"
      >
        Sair →
      </button>
    </div>
  )
}
