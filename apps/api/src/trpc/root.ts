import { router, publicProcedure } from './trpc'
import { transactionsRouter } from './routers/transactions'

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  transactions: transactionsRouter,
})

export type AppRouter = typeof appRouter
