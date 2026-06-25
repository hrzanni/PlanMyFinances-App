# Tarefas 1.5–1.6 — API (Fastify + tRPC) e Banco (Drizzle + Neon)

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/.env.example`
- Create: `apps/api/src/db/{client.ts,schema.ts}`, `apps/api/drizzle.config.ts`
- Create: `apps/api/src/trpc/{trpc.ts,context.ts,root.ts}`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/db/seed.ts`

**Interfaces:**
- Consumes: `@pmf/schemas`, `@pmf/core`, `@pmf/types`.
- Produces: `db` (DrizzleDB), tabelas do schema, `t` (tRPC init), `publicProcedure`, `createContext`, `appRouter`, `AppRouter` (tipo exportado para os clientes).

---

## 1.5 — Scaffold da API

- [ ] **Passo 1: `apps/api/package.json`**

```json
{
  "name": "@pmf/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/seed.ts"
  },
  "dependencies": {
    "@pmf/core": "workspace:*",
    "@pmf/schemas": "workspace:*",
    "@pmf/types": "workspace:*",
    "@trpc/server": "^11.0.0",
    "fastify": "^5.0.0",
    "@fastify/cors": "^10.0.0",
    "drizzle-orm": "^0.36.0",
    "@neondatabase/serverless": "^0.10.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Passo 2: `apps/api/.env.example`**

```
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=troque-isto
RESEND_API_KEY=
AUTH_BYPASS=false
PORT=3333
WEB_ORIGIN=http://localhost:3000
```

- [ ] **Passo 3: `apps/api/tsconfig.json`**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist", "rootDir": "src", "module": "ESNext", "moduleResolution": "Bundler" }, "include": ["src"] }
```

---

## 1.6 — Banco (Drizzle schema completo)

- [ ] **Passo 4: `apps/api/src/db/schema.ts`** (todas as tabelas de domínio; tabelas de auth entram na tarefa 1.7)

```ts
import { pgTable, uuid, text, numeric, integer, date, timestamp, pgEnum, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const txType = pgEnum('tx_type', ['receita', 'despesa'])
export const chargeStatus = pgEnum('charge_status', ['pendente', 'cobrado', 'pago'])
export const invoiceStatus = pgEnum('invoice_status', ['pendente', 'pago'])
export const subStatus = pgEnum('sub_status', ['ativo', 'cancelado'])

// users é criada pelo adapter do Better Auth (tarefa 1.7). Referenciamos por id (uuid).
export const users = pgTable('users', { id: uuid('id').primaryKey().defaultRandom() })

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: txType('type').notNull(),
})

export const subcategories = pgTable('subcategories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: txType('type').notNull(),
  value: numeric('value', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  subcategoryId: uuid('subcategory_id').references(() => subcategories.id, { onDelete: 'set null' }),
  date: date('date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ valuePositive: check('tx_value_positive', sql`${t.value} > 0`) }))

export const charges = pgTable('charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  debtorName: text('debtor_name').notNull(),
  description: text('description'),
  amountPerInstallment: numeric('amount_per_installment', { precision: 12, scale: 2 }).notNull(),
  totalInstallments: integer('total_installments').notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  dueDate: date('due_date'),
  status: chargeStatus('status').notNull().default('pendente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  paidWithinTotal: check('charge_paid_le_total', sql`${t.amountPaid} <= ${t.amountPerInstallment} * ${t.totalInstallments}`),
  installmentsMin: check('charge_installments_min', sql`${t.totalInstallments} >= 1`),
}))

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardName: text('card_name').notNull(),
  description: text('description'),
  amountPerInstallment: numeric('amount_per_installment', { precision: 12, scale: 2 }).notNull(),
  totalInstallments: integer('total_installments').notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  dueDate: date('due_date'),
  status: invoiceStatus('status').notNull().default('pendente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  paidWithinTotal: check('invoice_paid_le_total', sql`${t.amountPaid} <= ${t.amountPerInstallment} * ${t.totalInstallments}`),
  installmentsMin: check('invoice_installments_min', sql`${t.totalInstallments} >= 1`),
}))

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDay: integer('due_day'),
  status: subStatus('status').notNull().default('ativo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ dueDayRange: check('sub_due_day_range', sql`${t.dueDay} is null or (${t.dueDay} >= 1 and ${t.dueDay} <= 31)`) }))
```

> Nota: a tabela `users` aqui é um placeholder mínimo. A tarefa 1.7 (Better Auth) define as colunas reais de `users` e as tabelas de sessão; ao integrar, substituir o placeholder pelo schema do adapter, mantendo `id uuid` como PK para as FKs acima continuarem válidas.

- [ ] **Passo 5: `apps/api/src/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
export type DrizzleDB = typeof db
```

- [ ] **Passo 6: `apps/api/drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- [ ] **Passo 7: Gerar e aplicar migration**

Run: `cd apps/api && pnpm db:generate`
Expected: cria SQL em `apps/api/drizzle/`.

Run: `pnpm db:migrate`
Expected: tabelas criadas no Neon sem erro. (Requer `DATABASE_URL` no `.env` local apontando para um banco Neon de dev.)

---

## tRPC base

- [ ] **Passo 8: `apps/api/src/trpc/context.ts`**

```ts
import { db, type DrizzleDB } from '../db/client'

export interface Context {
  userId: string | null
  db: DrizzleDB
}

// A resolução de userId real é plugada na tarefa 1.7 (Better Auth).
export async function createContext(): Promise<Context> {
  return { userId: null, db }
}
```

- [ ] **Passo 9: `apps/api/src/trpc/trpc.ts`**

```ts
import { initTRPC } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
```

- [ ] **Passo 10: `apps/api/src/trpc/root.ts`** (router raiz, vazio por enquanto)

```ts
import { router, publicProcedure } from './trpc'

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
})

export type AppRouter = typeof appRouter
```

- [ ] **Passo 11: `apps/api/src/server.ts`**

```ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc/root'
import { createContext } from './trpc/context'

const app = Fastify({ logger: true })
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? true, credentials: true })
await app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
})
app.get('/health', async () => ({ ok: true }))

const port = Number(process.env.PORT ?? 3333)
await app.listen({ port, host: '0.0.0.0' })
```

- [ ] **Passo 12: Subir e verificar healthcheck**

Run: `cd apps/api && pnpm dev`
Em outro terminal: `curl http://localhost:3333/health`
Expected: `{"ok":true}`

Run: `curl http://localhost:3333/trpc/health`
Expected: resposta tRPC com `{"result":{"data":{"ok":true}}}`.

- [ ] **Passo 13: Seed mínimo `apps/api/src/db/seed.ts`** (usuário dev fixo para o modo DEV)

```ts
import { db } from './client'
import { users } from './schema'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  await db.insert(users).values({ id: DEV_USER_ID }).onConflictDoNothing()
  console.log('[seed] usuário dev provisionado:', DEV_USER_ID)
}
main()
```

> Após a tarefa 1.7, o seed grava também email/hash do usuário dev conforme o schema do Better Auth.

- [ ] **Passo 14: Commit**

```bash
git add apps/api && git commit -m "feat(api): scaffold fastify+trpc, schema drizzle e conexão neon"
```
