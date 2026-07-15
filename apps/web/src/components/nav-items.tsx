import Link from 'next/link'

/** Itens e blocos de navegação compartilhados entre Sidebar (desktop) e MobileNav. */

export interface NavItem {
  href: string
  label: string
  soon?: boolean
}

export const mainItems: NavItem[] = [
  { href: '/', label: 'Início' },
  { href: '/historico', label: 'Histórico' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/pastas', label: 'Pastas' },
]

export const accountItems: NavItem[] = [
  { href: '/gastos-fixos', label: 'Fixos' },
  { href: '/cobrancas', label: 'Cobranças' },
  { href: '/faturas', label: 'Faturas' },
]

export const automationItems: NavItem[] = [
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

/** Os três grupos completos, na ordem canônica. */
export function NavGroups({ path }: { path: string }) {
  return (
    <>
      <NavGroup items={mainItems} path={path} />
      <NavGroup title="Contas" items={accountItems} path={path} />
      <NavGroup title="Automação" items={automationItems} path={path} />
    </>
  )
}
