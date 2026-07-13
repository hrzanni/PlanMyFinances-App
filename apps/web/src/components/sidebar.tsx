'use client'

import { usePathname } from 'next/navigation'
import { NavGroups } from '@/components/nav-items'
import { NavFooter } from '@/components/nav-footer'

/** Navegação desktop (md+). Abaixo de md o MobileNav assume. */
export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar pb-4 pt-5 max-md:hidden">
      <div className="px-5 pb-4 text-base font-black text-white">
        Plan<span className="font-light text-neutral-400">My</span>Finances
      </div>
      <nav className="flex-1 overflow-y-auto">
        <NavGroups path={path} />
      </nav>
      <NavFooter />
    </aside>
  )
}
