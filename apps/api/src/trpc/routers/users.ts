import { TRPCError } from '@trpc/server'
import { updateUserNameInput, updateUserProfileInput } from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/users'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' })

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const row = await service.getUser(ctx.db, ctx.userId)
    if (!row) throw notFound()
    return row
  }),

  // mantido por compatibilidade com builds mobile antigos; clientes novos usam updateProfile
  updateName: protectedProcedure.input(updateUserNameInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateUserName(ctx.db, ctx.userId, input.name)
    if (!row) throw notFound()
    return row
  }),

  updateProfile: protectedProcedure
    .input(updateUserProfileInput)
    .mutation(async ({ ctx, input }) => {
      const row = await service.updateUserProfile(ctx.db, ctx.userId, input)
      if (!row) throw notFound()
      return row
    }),
})
