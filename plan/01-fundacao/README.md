# Fase 1 — Fundação (monorepo + API base) · Plano de Implementação

> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Goal:** entregar a fundação multiplataforma: monorepo TS funcionando, API tRPC no ar, banco e autenticação prontos, uma fatia vertical completa (transações) ponta a ponta, e CI + SonarCloud verdes.

**Architecture:** monorepo pnpm + Turborepo. A API (`apps/api`) é a única fonte da verdade: Fastify hospeda tRPC, Drizzle fala com Postgres/Neon, Better Auth cuida de identidade. Lógica de cálculo é pura em `packages/core`; validação em `packages/schemas`; tipos em `packages/types`. Nenhum cliente toca o banco.

**Tech Stack:** TypeScript 5, pnpm 9, Turborepo, Fastify 5, tRPC 11, Drizzle ORM + `@neondatabase/serverless`, Better Auth, Zod, Vitest, Resend.

## Global Constraints

Aplicam-se a TODAS as tarefas desta fase (e do projeto). Cópia literal da spec:

- Máximo de **300 linhas por arquivo** (RE-001). Quebrar em módulos menores ao ultrapassar.
- **Modularização** (RE-002): service / procedure / schema / cálculo / componente em arquivos separados.
- **DRY** (RE-003): cálculos, formatação, validação e queries por `user_id` extraídos para módulo único.
- **Cálculo de domínio é função pura** em `packages/core` (RE-006), sem banco/framework/rede.
- Valores monetários: `numeric(12,2)` no banco; nunca float. IDs `uuid` default `gen_random_uuid()`. `created_at` `timestamptz default now()`. Datas como `date`.
- Toda tabela de domínio tem `user_id` (FK → users). Toda leitura/escrita filtra por `user_id` da identidade (FR-070).
- Toda procedure de mutação valida identidade antes de executar (FR-071).
- Idioma: código/tabelas em EN; docs/commits em PT-BR.
- Nenhum segredo no bundle de cliente; `.env` nunca commitado.
- Antes de reportar pronto: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passam.

## Interfaces produzidas nesta fase (contrato entre tarefas)

Nomes e tipos que tarefas posteriores consomem. Mantidos idênticos ao longo do plano.

```ts
// packages/types
type TransactionType = 'receita' | 'despesa'
type ChargeStatus = 'pendente' | 'cobrado' | 'pago'
type InvoiceStatus = 'pendente' | 'pago'
type SubscriptionStatus = 'ativo' | 'cancelado'

interface Transaction {
  id: string; userId: string; type: TransactionType; value: string; // numeric vem como string
  description: string | null; categoryId: string | null; subcategoryId: string | null;
  date: string; createdAt: string;
}

// packages/core
function monthRange(ref: Date): { from: string; to: string }
function monthlyBalance(txs: Pick<Transaction,'type'|'value'>[]): { income: number; expense: number; balance: number }
function installmentTotals(amountPerInstallment: number, totalInstallments: number, amountPaid: number): { total: number; remaining: number }
function dueThisMonth(dueDate: string | null, ref: Date): boolean
function formatCurrency(value: number): string  // pt-BR / BRL
function formatDate(iso: string): string        // DD/MM/YYYY

// packages/schemas (Zod)
const createTransactionInput // { type, value>0, date, description?, categoryId?, subcategoryId? }

// apps/api — contexto e procedures
type Ctx = { userId: string | null; db: DrizzleDB }
const protectedProcedure // exige ctx.userId, senão UNAUTHORIZED
// router: transactions.{ create, list, update, delete }
```

## Subtarefas (ordem)

| # | Arquivo | Entrega testável |
|---|---|---|
| 1.1 | `01-monorepo-setup.md` | `pnpm install` + `pnpm turbo run build` rodam sem erro num monorepo vazio |
| 1.2–1.4 | `02-shared-packages.md` | `packages/core` com testes verdes de saldo, parcelas, vence-este-mês, formatação |
| 1.5–1.6 | `03-api-database.md` | API responde healthcheck; migrations criam o schema no Neon |
| 1.7 | `04-auth.md` | signup→login→sessão/token; `protectedProcedure` barra anônimo |
| 1.8 | `05-transactions-slice.md` | CRUD de transações via tRPC com isolamento por usuário provado em teste |
| 1.9–1.10 | `06-ci-quality.md` | PR dispara CI verde + SonarCloud Quality Gate |

## Definition of Done da fase

- Todas as subtarefas `[x]` no `run_tasks.md`.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes na raiz.
- API sobe local, healthcheck OK, signup/login funcionam, CRUD de transação funciona via cliente tRPC de teste.
- CI e SonarCloud verdes num PR de exemplo.
- Atualizar o changelog do `run_tasks.md`.
