'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { isDevBypassEnabled } from '@/lib/dev-mode'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { LoadingState } from '@pmf/ui-web'

/** Guard de rotas autenticadas: sem sessão e sem bypass → login (FR-064/FR-080 no cliente). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const authenticated = isDevBypassEnabled || !!session

  useEffect(() => {
    if (!isPending && !authenticated) router.replace('/login')
  }, [authenticated, isPending, router])

  if (isPending) return <LoadingState label="Carregando sessão…" />
  if (!authenticated) return null

  return (
    <div className="flex min-h-screen max-md:flex-col">
      <MobileNav />
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-6 max-md:px-4 lg:px-8">{children}</main>
    </div>
  )
}
