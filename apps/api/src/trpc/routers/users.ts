import { TRPCError } from '@trpc/server'
import { updateUserNameInput } from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/users'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' })

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const row = await service.getUser(ctx.db, ctx.userId)
    if (!row) throw notFound()
    return row
  }),

  updateName: protectedProcedure.input(updateUserNameInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateUserName(ctx.db, ctx.userId, input.name)
    if (!row) throw notFound()
    return row
  }),
})
