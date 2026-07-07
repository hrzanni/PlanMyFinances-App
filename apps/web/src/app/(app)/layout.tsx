'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Sidebar } from '@/components/sidebar'
import { LoadingState } from '@pmf/ui-web'

/** Guard de rotas autenticadas: sem sessão → login (FR-064 no cliente). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) router.replace('/login')
  }, [session, isPending, router])

  if (isPending) return <LoadingState label="Carregando sessão…" />
  if (!session) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">{children}</main>
    </div>
  )
}
