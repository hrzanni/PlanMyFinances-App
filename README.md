# PlanMyFinances

App de gestão de finanças pessoais, com paridade total entre **web** e **mobile** (Android primeiro, iOS no backlog). Construído com a regra de planejar antes de codar: cada fase tem spec e plano de tarefas antes da implementação.

## O que o app faz

Controle de finanças pessoais por usuário, isolado e seguro:

- **Transações** de receita e despesa, com categoria e subcategoria, data e descrição.
- **Categorias e subcategorias** com CRUD e regras de deleção seguras.
- **Cobranças** (valores a receber, parcelados) e **Faturas** (valores a pagar), com cálculo de total e restante.
- **Assinaturas** (recorrências mensais informativas).
- **Dashboard** com cards do mês, gráfico de receitas × despesas e saldo acumulado.
- **Autenticação** com email/senha e recuperação de senha.

A regra de negócio (saldo do mês, total/restante de parcelas, "vence este mês") vive em um pacote puro e testado, reusado por todos os clientes.

## Arquitetura

A lógica de negócio mora em uma **API única** que web, mobile e um futuro agente conversacional consomem por igual. Nenhum cliente acessa o banco direto.

```
monorepo (pnpm + Turborepo)
├── apps/
│   ├── api      → API tRPC sobre Fastify + Drizzle + Better Auth (fonte da verdade)
│   ├── web      → Next.js (App Router) consumindo a API
│   └── mobile   → Expo / React Native + NativeWind
└── packages/
    ├── core     → cálculos de domínio puros e testados
    ├── schemas  → validação Zod compartilhada
    ├── types    → tipos de domínio compartilhados
    └── ui-web   → componentes de UI da web
```

## Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| API | tRPC + Fastify |
| Web | Next.js, Tailwind, shadcn/ui |
| Mobile | Expo, React Native, NativeWind |
| Banco | Postgres (Neon) + Drizzle ORM |
| Auth | Better Auth (cookie na web, token no mobile) |
| Estado de servidor | TanStack Query |
| Validação | Zod |
| Testes | Vitest |
| Qualidade | GitHub Actions (CI) + SonarCloud |

## Planejamento e progresso

Este repositório segue um fluxo de spec → plano → implementação.

- **Spec de arquitetura:** [`docs/superpowers/specs/2026-06-25-planmyfinances-multiplatform-design.md`](docs/superpowers/specs/2026-06-25-planmyfinances-multiplatform-design.md)
- **Plano de tarefas por fase:** [`plan/`](plan/)
- **Painel de progresso:** [`run_tasks.md`](run_tasks.md) (estado de cada tarefa e subtarefa)

Fases: **1. Fundação** (monorepo + API) · **2. Web** · **3. Mobile** · **4. Polimento** · **5. Backlog** (agente, iOS).

> Status: planejamento concluído; fase 1 detalhada e pronta para implementação.

## Convenções

- Máximo de 300 linhas por arquivo; um arquivo, uma responsabilidade.
- Código e nomes de tabela em inglês; UI, documentação e commits em português.
- Valores monetários como `numeric(12,2)`; nunca float.
- Toda tabela de domínio é isolada por `user_id`.
- Antes de concluir qualquer tarefa: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Começando (será preenchido conforme a fase 1 avança)

Pré-requisitos: Node 20+, pnpm 9+, um banco Postgres (Neon) para a `DATABASE_URL`.

```bash
pnpm install
# copie apps/api/.env.example para apps/api/.env e preencha DATABASE_URL e BETTER_AUTH_SECRET
pnpm --filter @pmf/api db:migrate
pnpm dev
```

> Os comandos acima passam a valer à medida que as tarefas da fase 1 são implementadas. Veja `run_tasks.md` para o que já existe.
