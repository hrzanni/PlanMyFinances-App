import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../../api/src/trpc/root'

export const trpc = createTRPCReact<AppRouter>()

export type RouterOutputs = inferRouterOutputs<AppRouter>

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'
}
