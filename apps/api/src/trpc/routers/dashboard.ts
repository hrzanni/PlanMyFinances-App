import { z } from 'zod'
import { isoMonth } from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import { monthSummary } from '../../services/summary'

export const dashboardRouter = router({
  month: protectedProcedure
    .input(z.object({ month: isoMonth }))
    .query(({ ctx, input }) => monthSummary(ctx.db, ctx.userId, input.month)),
})
