'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NavGroups } from '@/components/nav-items'
import { NavFooter } from '@/components/nav-footer'

/** Navegação mobile (abaixo de md): barra superior + menu em tela cheia. */
export function MobileNav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  // navegar fecha o menu
  useEffect(() => setOpen(false), [path])

  return (
    <div className="md:hidden">
      <div className="flex h-12 items-center justify-between bg-sidebar px-4">
        <span className="text-base font-black text-white">
          Plan<span className="font-light text-neutral-400">My</span>Finances
        </span>
        <button
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="px-2 py-1 text-xl leading-none text-white"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-12 z-50 flex flex-col overflow-y-auto bg-sidebar pb-4">
          <nav className="flex-1">
            <NavGroups path={path} />
          </nav>
          <NavFooter />
        </div>
      ) : null}
    </div>
  )
}
