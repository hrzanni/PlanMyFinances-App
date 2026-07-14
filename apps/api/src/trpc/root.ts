import { router, publicProcedure } from './trpc'
import { transactionsRouter } from './routers/transactions'
import { cardsRouter } from './routers/cards'
import { categoriesRouter } from './routers/categories'
import { fixedExpensesRouter } from './routers/fixed-expenses'
import { foldersRouter } from './routers/folders'
import { chargesRouter } from './routers/charges'
import { invoicesRouter } from './routers/invoices'
import { dashboardRouter } from './routers/dashboard'
import { usersRouter } from './routers/users'

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  transactions: transactionsRouter,
  cards: cardsRouter,
  categories: categoriesRouter,
  fixedExpenses: fixedExpensesRouter,
  folders: foldersRouter,
  charges: chargesRouter,
  invoices: invoicesRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
