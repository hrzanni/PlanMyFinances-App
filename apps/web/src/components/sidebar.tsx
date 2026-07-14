'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NavGroups } from '@/components/nav-items'
import { NavFooter } from '@/components/nav-footer'

/** Navegação desktop (md+). Abaixo de md o MobileNav assume. */
export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar pb-4 pt-5 max-md:hidden">
      <div className="flex items-center gap-2.5 px-5 pb-4">
        <Image src="/logo-p.png" alt="" width={28} height={28} className="rounded-md" />
        <span className="text-base font-black text-white">
          Plan<span className="font-light text-neutral-400">My</span>Finances
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <NavGroups path={path} />
      </nav>
      <NavFooter />
    </aside>
  )
}
