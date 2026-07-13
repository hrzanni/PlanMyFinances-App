import { createTRPCReact } from '@trpc/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../../api/src/trpc/root'

export const trpc = createTRPCReact<AppRouter>()
export type RouterOutputs = inferRouterOutputs<AppRouter>
