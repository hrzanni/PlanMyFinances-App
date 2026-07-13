'use client'

import { useState } from 'react'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { ThemeProvider } from 'next-themes'
import { trpc, apiUrl } from '@/lib/trpc'
import { showErrorToast } from '@/lib/toast'
import { Toaster } from '@/components/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 },
        },
        // Rede de segurança: mutação sem onError próprio nunca falha em silêncio (FR-005).
        mutationCache: new MutationCache({
          onError: (_error, _variables, _context, mutation) => {
            if (mutation.options.onError) return
            showErrorToast('Não foi possível concluir a ação. Tente novamente.')
          },
        }),
      }),
  )
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${apiUrl()}/trpc`,
          fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
        }),
      ],
    }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  )
}
