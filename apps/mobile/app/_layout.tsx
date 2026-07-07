import { useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/lib/trpc'
import { apiUrl } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import '../global.css'

export default function RootLayout() {
  const scheme = useColorScheme()
  // ME-003: cache com expiração — dados não usados são descartados, não acumulados
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 },
        },
      }),
  )
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${apiUrl()}/trpc`,
          // token do SecureStore vai no Authorization (bearer) — FR-063
          headers() {
            const headers = new Map<string, string>()
            const cookies = authClient.getCookie()
            if (cookies) headers.set('Cookie', cookies)
            return Object.fromEntries(headers)
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
