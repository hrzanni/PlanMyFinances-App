'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { signOut } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc'

/** Rodapé da navegação (tema, perfil, sair) — usado na Sidebar e no MobileNav. */
export function NavFooter() {
  const router = useRouter()
  const me = trpc.users.me.useQuery()
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
      <Link href="/perfil" className="block hover:text-white">
        <div className="truncate text-xs font-bold text-neutral-300">
          {me.data?.name ?? 'Perfil'}
        </div>
        <div className="truncate text-xs text-neutral-500">{me.data?.email}</div>
      </Link>
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
