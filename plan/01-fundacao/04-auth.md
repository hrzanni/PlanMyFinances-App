# Tarefa 1.7 — Autenticação (Better Auth)

**Files:**
- Create: `apps/api/src/auth/auth.ts`, `apps/api/src/auth/schema.ts`
- Modify: `apps/api/src/db/schema.ts` (substituir placeholder `users` pelo schema do adapter)
- Modify: `apps/api/src/trpc/context.ts` (resolver `userId` da sessão/token)
- Modify: `apps/api/src/trpc/trpc.ts` (adicionar `protectedProcedure`)
- Modify: `apps/api/src/server.ts` (montar handler do Better Auth)
- Test: `apps/api/src/trpc/protected.test.ts`

**Interfaces:**
- Consumes: `db`, `Context`.
- Produces: `auth` (instância Better Auth), `protectedProcedure` (garante `ctx.userId: string`), tabelas `users/sessions/accounts/verifications`.

**Constraint da fase aplicável:** senhas com hash gerenciado pelo Better Auth, nunca texto puro (FR-061); web por cookie, mobile por token (FR-063).

- [ ] **Passo 1: Instalar e configurar Better Auth** — `apps/api/src/auth/auth.ts`

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { db } from '../db/client'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET!,
  // bearer habilita autenticação por token (mobile), além do cookie (web)
  plugins: [bearer()],
})
```

> Adicionar dependência `better-auth` ao `apps/api/package.json`. O envio de email de reset usa Resend; configurar o callback `sendResetPassword` com a `RESEND_API_KEY` (FR-062).

- [ ] **Passo 2: Gerar/definir o schema de auth** — `apps/api/src/auth/schema.ts`

Use o gerador do Better Auth para produzir as tabelas (`users`, `sessions`, `accounts`, `verifications`) e mova-as para o schema do Drizzle. A `users.id` MUST permanecer `uuid` PK para as FKs de domínio continuarem válidas.

Run: `pnpm dlx @better-auth/cli generate`
Expected: emite as definições de tabela; integrá-las em `apps/api/src/db/schema.ts` substituindo o placeholder `users`.

- [ ] **Passo 3: Regenerar migration**

Run: `cd apps/api && pnpm db:generate && pnpm db:migrate`
Expected: tabelas de auth criadas; FKs de domínio intactas.

- [ ] **Passo 4: Montar o handler no servidor** — modificar `apps/api/src/server.ts`

```ts
import { auth } from './auth/auth'

// dentro do setup do Fastify, antes do listen:
app.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(req, reply) {
    const res = await auth.handler(
      new Request(`${req.protocol}://${req.hostname}${req.url}`, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: req.method === 'GET' ? undefined : JSON.stringify(req.body),
      }),
    )
    reply.status(res.status)
    res.headers.forEach((v, k) => reply.header(k, v))
    reply.send(await res.text())
  },
})
```

- [ ] **Passo 5: Resolver identidade no contexto** — modificar `apps/api/src/trpc/context.ts`

```ts
import { db, type DrizzleDB } from '../db/client'
import { auth } from '../auth/auth'

export interface Context { userId: string | null; db: DrizzleDB }

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function createContext({ req }: { req: { headers: Record<string, string | string[] | undefined> } }): Promise<Context> {
  if (process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    return { userId: DEV_USER_ID, db }
  }
  const session = await auth.api.getSession({ headers: req.headers as any })
  return { userId: session?.user?.id ?? null, db }
}
```

> Ajustar a assinatura de `createContext` conforme o adapter Fastify do tRPC entrega `req`/`res`. O ponto fixo: a sessão (cookie web) ou o bearer token (mobile) resolvem `userId`.

- [ ] **Passo 6: Guard de produção (FR-081)** — no topo de `apps/api/src/server.ts`

```ts
if (process.env.NODE_ENV === 'production' && process.env.AUTH_BYPASS === 'true') {
  throw new Error('AUTH_BYPASS não pode estar ligado em produção')
}
```

- [ ] **Passo 7: `protectedProcedure`** — modificar `apps/api/src/trpc/trpc.ts`

```ts
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, userId: ctx.userId } }) // userId agora string
})
```

- [ ] **Passo 8: Teste — anônimo é barrado** — `apps/api/src/trpc/protected.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { router, protectedProcedure } from './trpc'
import { db } from '../db/client'

const testRouter = router({ secret: protectedProcedure.query(() => 'ok') })

describe('protectedProcedure', () => {
  it('lança UNAUTHORIZED sem userId', async () => {
    const caller = testRouter.createCaller({ userId: null, db })
    await expect(caller.secret()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
  it('passa com userId', async () => {
    const caller = testRouter.createCaller({ userId: 'u1', db })
    await expect(caller.secret()).resolves.toBe('ok')
  })
})
```

- [ ] **Passo 9: Rodar e ver passar**

Run: `pnpm --filter @pmf/api test`
Expected: 2 PASS.

- [ ] **Passo 10: Verificação manual do fluxo**

Subir a API (`pnpm dev`), então:
- signup: `POST /api/auth/sign-up/email` com `{email,password,name}` → 200 e cria usuário.
- login: `POST /api/auth/sign-in/email` → 200, retorna cookie (web) e token (mobile via header bearer).
- chamar uma `protectedProcedure` sem credencial → UNAUTHORIZED; com credencial → sucesso.

- [ ] **Passo 11: Commit**

```bash
git add apps/api && git commit -m "feat(auth): better auth (cookie web + token mobile), protectedProcedure e guard de produção"
```
