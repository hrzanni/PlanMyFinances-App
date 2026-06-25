# run_tasks — PlanMyFinances

> Painel mestre de tarefas. Fonte da verdade do progresso.
> Atualize o status de cada subtarefa conforme avança. Legenda: `[ ]` pendente · `[~]` em andamento · `[x]` concluída · `[!]` bloqueada.
> Detalhe de cada tarefa vive em `plan/<tarefa>/`. Spec base: `docs/superpowers/specs/2026-06-25-planmyfinances-multiplatform-design.md`.

## Visão geral

| Fase | Tarefa | Status | Detalhe |
|---|---|---|---|
| 1 | Fundação (monorepo + API base) | `[ ]` | `plan/01-fundacao/` |
| 2 | Web (Next.js) | `[ ]` | `plan/02-web/` |
| 3 | Mobile (Expo / React Native) | `[ ]` | `plan/03-mobile/` |
| 4 | Polimento (tema, gráficos, edge cases) | `[ ]` | `plan/04-polimento/` |
| 5 | Backlog (agente, iOS) | `[ ]` | `plan/05-backlog/` |

> Regra: uma fase só começa quando a anterior está com todas as subtarefas `[x]`, salvo dependências explicitamente liberadas.

---

## Fase 1 — Fundação (DETALHADA) · `plan/01-fundacao/`

Entrega: monorepo funcionando, API tRPC no ar, banco e auth prontos, primeira fatia vertical (transações) ponta a ponta, CI + SonarCloud verdes.

- [ ] **1.1 Setup do monorepo** · `01-monorepo-setup.md`
  - [ ] 1.1.1 pnpm workspace + estrutura de pastas
  - [ ] 1.1.2 Turborepo (`turbo.json`) com pipelines lint/typecheck/test/build
  - [ ] 1.1.3 tsconfig base compartilhado
  - [ ] 1.1.4 ESLint + Prettier + `.gitignore` + `.editorconfig`
- [ ] **1.2–1.4 Pacotes compartilhados** · `02-shared-packages.md`
  - [ ] 1.2 `packages/types` (tipos de domínio)
  - [ ] 1.3 `packages/schemas` (Zod de input/output)
  - [ ] 1.4 `packages/core` (cálculos puros + utils, com testes TDD)
- [ ] **1.5–1.6 API + Banco** · `03-api-database.md`
  - [ ] 1.5 `apps/api`: Fastify + tRPC scaffold + healthcheck
  - [ ] 1.6 Drizzle schema (todas as tabelas) + Neon + migrations + seed
- [ ] **1.7 Autenticação (Better Auth)** · `04-auth.md`
  - [ ] 1.7.1 Adapter Drizzle + tabelas de auth
  - [ ] 1.7.2 signup / login / logout (cookie web + token mobile)
  - [ ] 1.7.3 recuperação de senha (email via Resend)
  - [ ] 1.7.4 `protectedProcedure` (contexto tRPC com identidade)
- [ ] **1.8 Fatia vertical: Transações** · `05-transactions-slice.md`
  - [ ] 1.8.1 service de transações (CRUD, filtro `user_id`) — TDD
  - [ ] 1.8.2 procedures tRPC (create/list/update/delete)
  - [ ] 1.8.3 teste de isolamento por usuário (A não vê B)
- [ ] **1.9–1.10 CI e Qualidade** · `06-ci-quality.md`
  - [ ] 1.9 GitHub Action CI (`ci.yml`): lint → typecheck → test → build
  - [ ] 1.10 GitHub Action SonarCloud (`sonar.yml` + `sonar-project.properties`) + Quality Gate

---

## Fase 2 — Web (Next.js) · `plan/02-web/` (mapa, detalhe depois)

Entrega: app web completo consumindo a API, paridade com todos os domínios.

- [ ] **2.1 Scaffold web** — Next.js (App Router) + Tailwind + shadcn/ui + cliente tRPC + TanStack Query
- [ ] **2.2 Auth web** — telas login/signup/forgot/reset, sessão por cookie, guard de rotas
- [ ] **2.3 `packages/ui-web`** — Button, Input, Select, Card, Dialog, Table, Tabs, Badge
- [ ] **2.4 Transações** — Home (5 últimas + 3 cards + barra), CRUD, formulário com filtro de categoria
- [ ] **2.5 Histórico** — lista + filtros cumulativos persistidos na URL + excluir
- [ ] **2.6 Categorias/Subcategorias** — CRUD com regra de cascade/SET NULL
- [ ] **2.7 Cobranças** — cards + tabela + status inline + validação `amount_paid`
- [ ] **2.8 Faturas + Assinaturas** — abas, cards, CRUD
- [ ] **2.9 Dashboard** — seletor de mês, cards, barra, linha de saldo acumulado
- [ ] **2.10 Layout/Navegação** — sidebar autenticada, responsividade

---

## Fase 3 — Mobile (Expo / React Native) · `plan/03-mobile/` (mapa, detalhe depois)

Entrega: app Android com paridade total e requisitos de memória atendidos.

- [ ] **3.1 Scaffold mobile** — Expo + React Native + NativeWind + cliente tRPC + TanStack Query
- [ ] **3.2 Auth mobile** — login/signup/forgot/reset, token em SecureStore, refresh
- [ ] **3.3 Componentes base mobile** — equivalentes nativos (Button, Input, Card, Sheet, List, Tabs, Badge)
- [ ] **3.4 Memória (ME-001..004)** — FlashList virtualizada, paginação por mês, config de cache TanStack Query
- [ ] **3.5 Transações + Home** — paridade FR-001..003
- [ ] **3.6 Histórico** — filtros persistidos no estado de navegação
- [ ] **3.7 Categorias/Subcategorias**
- [ ] **3.8 Cobranças**
- [ ] **3.9 Faturas + Assinaturas**
- [ ] **3.10 Dashboard** — gráficos com lib RN
- [ ] **3.11 Navegação nativa** — tabs/drawer, fluxo autenticado
- [ ] **3.12 Build Android** — EAS Build, gerar APK/AAB de teste

---

## Fase 4 — Polimento · `plan/04-polimento/` (mapa, detalhe depois)

- [ ] **4.1 Tema claro/escuro** — tokens compartilhados de cor/spacing/radius nas duas plataformas
- [ ] **4.2 Identidade visual** — paleta final via skill `frontend-design` (verde=entrada, vermelho=saída)
- [ ] **4.3 Edge cases** — mês vazio, sem categoria, sem due_date, parcela única, lista vazia, offline mobile
- [ ] **4.4 Estados de erro/loading** — padronizados nos dois clientes
- [ ] **4.5 Acessibilidade básica** — contraste, foco, labels
- [ ] **4.6 Verificação E2E manual** — roteiro de SC-009 na web e no mobile

---

## Fase 5 — Backlog · `plan/05-backlog/` (mapa, detalhe depois)

- [ ] **5.1 Agente conversacional (AG-001)** — tabela `external_links`, API keys/token de serviço no Better Auth, vínculo canal→usuário, escolha de plataforma (WhatsApp/Telegram) e modelo (provavelmente Claude)
- [ ] **5.2 Superfície REST opcional (AG-002)** — `trpc-openapi` só para o agente, se a plataforma do agente não for TS
- [ ] **5.3 iOS** — build iOS do mesmo código Expo, ajustes de plataforma, publicação

---

## Changelog do progresso

> Registre aqui marcos concluídos com data ISO.

- 2026-06-25: plano criado (mapa completo + fase 1 detalhada).
