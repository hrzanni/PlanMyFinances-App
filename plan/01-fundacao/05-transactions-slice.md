# Tarefa 1.8 — Fatia vertical: Transações (service + tRPC + isolamento)

Prova a arquitetura ponta a ponta: schema → service (filtra `user_id`) → procedure tRPC → cálculo de `packages/core`. Quando isto fecha, os demais domínios são repetição do padrão.

**Files:**
- Create: `apps/api/src/services/transactions.ts`
- Create: `apps/api/src/routers/transactions.ts`
- Modify: `apps/api/src/trpc/root.ts` (registrar o router)
- Test: `apps/api/src/services/transactions.test.ts`

**Interfaces:**
- Consumes: `db`, `protectedProcedure`, `createTransactionInput`/`updateTransactionInput`/`listTransactionsInput` (de `@pmf/schemas`).
- Produces: `transactionsService.{ create, list, update, remove }` (todos recebem `userId` como 1º argumento) e `transactions` router com `create/list/update/delete`.

**Constraint:** toda função do service recebe `userId` e filtra por ele (FR-070). Nenhuma query sem `user_id`.

- [ ] **Passo 1: Teste que falha — isolamento por usuário** — `apps/api/src/services/transactions.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db/client'
import { transactions, users } from '../db/schema'
import { transactionsService } from './transactions'

const A = '00000000-0000-0000-0000-0000000000aa'
const B = '00000000-0000-0000-0000-0000000000bb'

beforeEach(async () => {
  await db.delete(transactions)
  await db.insert(users).values([{ id: A }, { id: B }]).onConflictDoNothing()
})

describe('transactionsService', () => {
  it('cria e lista apenas as transações do próprio usuário', async () => {
    await transactionsService.create(A, { type: 'receita', value: 100, date: '2026-06-10' })
    await transactionsService.create(B, { type: 'despesa', value: 30, date: '2026-06-11' })

    const listA = await transactionsService.list(A, { limit: 20 })
    expect(listA.items).toHaveLength(1)
    expect(listA.items[0]!.type).toBe('receita')
  })

  it('não permite atualizar transação de outro usuário', async () => {
    const tx = await transactionsService.create(A, { type: 'receita', value: 100, date: '2026-06-10' })
    const affected = await transactionsService.update(B, { id: tx.id, value: 999 })
    expect(affected).toBeNull() // B não atinge o registro de A
  })

  it('não permite excluir transação de outro usuário', async () => {
    const tx = await transactionsService.create(A, { type: 'receita', value: 100, date: '2026-06-10' })
    const removed = await transactionsService.remove(B, tx.id)
    expect(removed).toBe(false)
    const listA = await transactionsService.list(A, { limit: 20 })
    expect(listA.items).toHaveLength(1)
  })
})
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `pnpm --filter @pmf/api test transactions`
Expected: FAIL ("transactionsService is not defined"). (Requer `DATABASE_URL` de teste; usar um banco/branch Neon de teste.)

- [ ] **Passo 3: Implementar o service** — `apps/api/src/services/transactions.ts`

```ts
import { and, eq, desc, gte, lte } from 'drizzle-orm'
import { db } from '../db/client'
import { transactions } from '../db/schema'
import type { CreateTransactionInput, UpdateTransactionInput } from '@pmf/schemas'

interface ListArgs {
  month?: string; type?: 'receita' | 'despesa'; categoryId?: string; subcategoryId?: string
  dateFrom?: string; dateTo?: string; limit: number
}

export const transactionsService = {
  async create(userId: string, input: CreateTransactionInput) {
    const [row] = await db.insert(transactions).values({
      userId, type: input.type, value: String(input.value), date: input.date,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null, subcategoryId: input.subcategoryId ?? null,
    }).returning()
    return row!
  },

  async list(userId: string, args: ListArgs) {
    const conds = [eq(transactions.userId, userId)]
    if (args.type) conds.push(eq(transactions.type, args.type))
    if (args.categoryId) conds.push(eq(transactions.categoryId, args.categoryId))
    if (args.subcategoryId) conds.push(eq(transactions.subcategoryId, args.subcategoryId))
    if (args.dateFrom) conds.push(gte(transactions.date, args.dateFrom))
    if (args.dateTo) conds.push(lte(transactions.date, args.dateTo))
    const items = await db.select().from(transactions)
      .where(and(...conds))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(args.limit)
    return { items }
  },

  async update(userId: string, input: UpdateTransactionInput) {
    const { id, value, ...rest } = input
    const [row] = await db.update(transactions)
      .set({ ...rest, ...(value !== undefined ? { value: String(value) } : {}) })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning()
    return row ?? null
  },

  async remove(userId: string, id: string) {
    const rows = await db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id })
    return rows.length > 0
  },
}
```

- [ ] **Passo 4: Rodar e ver passar**

Run: `pnpm --filter @pmf/api test transactions`
Expected: 3 PASS. O isolamento está provado: B nunca atinge registros de A.

- [ ] **Passo 5: Router tRPC** — `apps/api/src/routers/transactions.ts`

```ts
import { router, protectedProcedure } from '../trpc/trpc'
import { createTransactionInput, updateTransactionInput, listTransactionsInput } from '@pmf/schemas'
import { z } from 'zod'
import { transactionsService } from '../services/transactions'

export const transactionsRouter = router({
  create: protectedProcedure.input(createTransactionInput)
    .mutation(({ ctx, input }) => transactionsService.create(ctx.userId, input)),
  list: protectedProcedure.input(listTransactionsInput)
    .query(({ ctx, input }) => transactionsService.list(ctx.userId, input)),
  update: protectedProcedure.input(updateTransactionInput)
    .mutation(({ ctx, input }) => transactionsService.update(ctx.userId, input)),
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => transactionsService.remove(ctx.userId, input.id)),
})
```

- [ ] **Passo 6: Registrar no router raiz** — modificar `apps/api/src/trpc/root.ts`

```ts
import { router, publicProcedure } from './trpc'
import { transactionsRouter } from '../routers/transactions'

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  transactions: transactionsRouter,
})

export type AppRouter = typeof appRouter
```

- [ ] **Passo 7: Verificação ponta a ponta**

Com a API no ar e um usuário logado (ou `AUTH_BYPASS=true` local), chamar `transactions.create` e `transactions.list` via cliente tRPC de teste ou `curl` nas rotas `/trpc/transactions.*`.
Expected: cria e lista só as do usuário da sessão.

- [ ] **Passo 8: Commit**

```bash
git add apps/api && git commit -m "feat(transactions): service+trpc com isolamento por usuário (fatia vertical)"
```
