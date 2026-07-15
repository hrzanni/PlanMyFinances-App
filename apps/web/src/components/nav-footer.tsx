'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { signOut } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc'

/** Iniciais para o avatar do rodapé: 1ª letra do primeiro e do último nome. */
function getInitials(name: string | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

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

  const initials = getInitials(me.data?.name)

  return (
    <div className="mx-3 mb-1 flex flex-col gap-2 rounded-xl bg-white/5 p-3">
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex items-center gap-2 py-1.5 text-xs text-neutral-400 hover:text-white"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10">
          {mounted && resolvedTheme === 'dark' ? '◐' : '◑'}
        </span>
        {mounted && resolvedTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      </button>
      <Link href="/perfil" className="flex items-center gap-2 py-1.5 hover:text-white">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="min-w-0">
          <div className="truncate text-xs font-bold text-neutral-300">
            {me.data?.name ?? 'Perfil'}
          </div>
          <div className="truncate text-xs text-neutral-500">{me.data?.email}</div>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="-mx-2 rounded-md px-2 py-1.5 text-left text-xs font-bold text-neutral-400 hover:bg-white/10 hover:text-white"
      >
        Sair →
      </button>
    </div>
  )
}
