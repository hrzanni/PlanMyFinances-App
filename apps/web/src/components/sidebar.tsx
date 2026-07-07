'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { signOut, useSession } from '@/lib/auth-client'

interface NavItem {
  href: string
  label: string
  soon?: boolean
}

const mainItems: NavItem[] = [
  { href: '/', label: 'Início' },
  { href: '/historico', label: 'Histórico' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/pastas', label: 'Pastas' },
]

const accountItems: NavItem[] = [
  { href: '/gastos-fixos', label: 'Gastos Fixos' },
  { href: '/cobrancas', label: 'Cobranças' },
  { href: '/faturas', label: 'Faturas' },
]

const automationItems: NavItem[] = [
  { href: '/conexoes', label: 'Conexões' },
  { href: '/agente', label: 'Agente', soon: true },
]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 border-l-2 px-5 py-2 text-sm transition-colors ${
        active
          ? 'border-white bg-white/5 font-bold text-white'
          : 'border-transparent text-neutral-400 hover:text-white'
      }`}
    >
      {item.label}
      {item.soon ? (
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#D8B523]">
          Em breve
        </span>
      ) : null}
    </Link>
  )
}

function NavGroup({ title, items, path }: { title?: string; items: NavItem[]; path: string }) {
  return (
    <>
      {title ? (
        <div className="px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {title}
        </div>
      ) : null}
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={path === item.href} />
      ))}
    </>
  )
}

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar pb-4 pt-5 max-md:w-16">
      <div className="px-5 pb-4 text-base font-black text-white max-md:hidden">
        Plan<span className="font-light text-neutral-400">My</span>Finances
      </div>
      <nav className="flex-1 overflow-y-auto max-md:hidden">
        <NavGroup items={mainItems} path={path} />
        <NavGroup title="Contas" items={accountItems} path={path} />
        <NavGroup title="Automação" items={automationItems} path={path} />
      </nav>
      <div className="mt-auto space-y-2 border-t border-white/10 px-5 pt-3 max-md:hidden">
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
    </aside>
  )
}
