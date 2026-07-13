# run_tasks — PlanMyFinances

> Painel mestre de tarefas. Fonte da verdade do progresso.
> Atualize o status de cada subtarefa conforme avança. Legenda: `[ ]` pendente · `[~]` em andamento · `[x]` concluída · `[!]` bloqueada.
> Detalhe de cada tarefa vive em `plan/<tarefa>/`.
> Specs: base `docs/superpowers/specs/2026-06-25-planmyfinances-multiplatform-design.md` + amendment `docs/superpowers/specs/2026-07-06-gastos-fixos-pastas-pluggy-design.md` (gastos fixos, pastas, Pluggy, tela do agente, tema Nexforce) + amendment `docs/superpowers/specs/2026-07-10-fusao-inicio-dashboard-design.md` (funde Início e Dashboard).
> Referência visual: `docs/mockups/planmyfinances-telas.html` (protótipo aprovado em 2026-07-06).

## Visão geral

| Fase | Tarefa | Status | Detalhe |
|---|---|---|---|
| 1 | Fundação (monorepo + API base) | `[x]` | `plan/01-fundacao/` |
| 2 | Web (Next.js + tema Nexforce) | `[x]` | `plan/02-web/` |
| 3 | Mobile (Expo / React Native) | `[x]` | `plan/03-mobile/` |
| 4 | Integração Meu Pluggy (Conexões) | `[!]` adiada | `plan/04-pluggy/` |
| 5 | Polimento (edge cases, a11y, E2E) | `[x]` | `plan/05-polimento/` |
| 6 | Backlog (agente real, iOS) | `[ ]` | `plan/06-backlog/` |
| 7 | Fusão Início/Dashboard | `[x]` | `plan/07-fusao-inicio-dashboard/` |

> Regra: uma fase só começa quando a anterior está com todas as subtarefas `[x]`, salvo dependências explicitamente liberadas.

---

## Fase 1 — Fundação (DETALHADA) · `plan/01-fundacao/`

Entrega: monorepo funcionando, API tRPC no ar, banco (com tabelas de gastos fixos, pastas e conexões) e auth prontos, primeira fatia vertical (transações) ponta a ponta, CI + SonarCloud verdes.

- [x] **1.1 Setup do monorepo** · `01-monorepo-setup.md`
  - [x] 1.1.1 pnpm workspace + estrutura de pastas
  - [x] 1.1.2 Turborepo (`turbo.json`) com pipelines lint/typecheck/test/build
  - [x] 1.1.3 tsconfig base compartilhado
  - [x] 1.1.4 ESLint + Prettier + `.gitignore` + `.editorconfig`
- [x] **1.2–1.4 Pacotes compartilhados** · `02-shared-packages.md`
  - [x] 1.2 `packages/types` (tipos de domínio, incl. gastos fixos/pastas/conexões)
  - [x] 1.3 `packages/schemas` (Zod de input/output)
  - [x] 1.4 `packages/core` (cálculos puros + utils, com testes TDD; incl. RN-100..102 e RN-110)
- [x] **1.5–1.6 API + Banco** · `03-api-database.md`
  - [x] 1.5 `apps/api`: Fastify + tRPC scaffold + healthcheck
  - [x] 1.6 Drizzle schema (todas as tabelas, incl. `fixed_expenses`, `fixed_expense_payments`, `folders`, `bank_connections`) + Neon + migrations + seed
- [x] **1.7 Autenticação (Better Auth)** · `04-auth.md`
  - [x] 1.7.1 Adapter Drizzle + tabelas de auth
  - [x] 1.7.2 signup / login / logout (cookie web + token mobile)
  - [x] 1.7.3 recuperação de senha (email via Resend)
  - [x] 1.7.4 `protectedProcedure` (contexto tRPC com identidade)
- [x] **1.8 Fatia vertical: Transações** · `05-transactions-slice.md`
  - [x] 1.8.1 service de transações (CRUD, filtro `user_id`) — TDD
  - [x] 1.8.2 procedures tRPC (create/list/update/delete)
  - [x] 1.8.3 teste de isolamento por usuário (A não vê B)
- [x] **1.9–1.10 CI e Qualidade** · `06-ci-quality.md`
  - [x] 1.9 GitHub Action CI (`ci.yml`): lint → typecheck → test → build — verificado no GitHub em 2026-07-13 (PR #1, verde em 2m33s)
  - [~] 1.10 GitHub Action SonarCloud (`sonar.yml` + `sonar-project.properties`) + Quality Gate — workflow pronto; execução pendente de setup do Hugo (repo público + projeto no sonarcloud.io + secret `SONAR_TOKEN`)

---

## Fase 2 — Web (Next.js) · `plan/02-web/`

Entrega: app web completo consumindo a API, todas as telas do protótipo aprovado, tema Nexforce claro/escuro.

- [x] **2.1 Scaffold web** — Next.js (App Router) + Tailwind + cliente tRPC + TanStack Query
- [x] **2.2 Tema Nexforce + `packages/ui-web`** — tokens claro/escuro, Lato, componentes base (Button, Input, Select, Card, Dialog, Table, Tabs, Badge, Toggle)
- [x] **2.3 Auth web** — telas login/signup/forgot/reset, sessão por cookie, guard de rotas
- [x] **2.4 Layout/Navegação** — sidebar escura em grupos (principal · Contas · Automação), item Agente "Em breve", responsividade
- [x] **2.5 Transações + Home** — 3 cards, barra, 5 últimas, widget gastos fixos, CRUD com campo Pasta
- [x] **2.6 Histórico** — filtros cumulativos na URL, badges de origem/pasta, excluir
- [x] **2.7 Categorias/Subcategorias** — CRUD, seções Despesas × Receitas separadas
- [x] **2.8 Gastos Fixos** — seletor de mês, 3 cards, toggle pago→transação automática, snapshot de valor, estados pago/pendente/vencido
- [x] **2.9 Pastas** — cards expansíveis com total gasto e transações dentro
- [x] **2.10 Cobranças** — cards + tabela + status inline + validação `amount_paid`
- [x] **2.11 Faturas** — cards + tabela + CRUD
- [x] **2.12 Dashboard** — seletor de mês, cards, barra, linha de saldo acumulado (Recharts)
- [x] **2.13 Tela do Agente** — chat estático "Em breve"

---

## Fase 3 — Mobile (Expo / React Native) · `plan/03-mobile/`

Entrega: app Android com paridade total, tema Nexforce e requisitos de memória atendidos.

- [x] **3.1 Scaffold mobile** — Expo + NativeWind + cliente tRPC + TanStack Query + Lato + tokens de tema
- [x] **3.2 Auth mobile** — login/signup/forgot/reset, token em SecureStore, refresh
- [x] **3.3 Componentes base mobile** — Button, Input, Card, Sheet, List, Tabs, Badge, Toggle nativos
- [x] **3.4 Memória (ME-001..004)** — FlashList virtualizada, paginação por mês, config de cache TanStack Query
- [x] **3.5 Navegação nativa** — 5 tabs (Início, Histórico, Fixos, Dash, Mais) + stack "Mais"
- [x] **3.6 Transações + Home** — paridade FR-001..003 + widget gastos fixos + campo Pasta
- [x] **3.7 Histórico** — filtros no estado de navegação, badges de origem/pasta
- [x] **3.8 Categorias/Subcategorias** — seções Despesas × Receitas
- [x] **3.9 Gastos Fixos** — lista com toggle pago, seletor de mês, cards
- [x] **3.10 Pastas** — cards expansíveis
- [x] **3.11 Cobranças**
- [x] **3.12 Faturas**
- [x] **3.13 Dashboard** — gráficos com lib RN
- [x] **3.14 Tela do Agente** — chat estático "Em breve"
- [x] **3.15 Build Android** — APK gerado no EAS (projeto @hrzannis-team/planmyfinances); exigiu node-linker=hoisted no monorepo. Segundo build aponta para a API em produção (Render)

---

## Fase 4 — Integração Meu Pluggy · `plan/04-pluggy/`

Entrega: contas reais sincronizando transações via Open Finance gratuito, tela Conexões nas duas plataformas.

- [ ] **4.1 Client Pluggy na API** — auth por client_id/secret, listar contas, buscar transações
- [ ] **4.2 Service de sync** — dedup por `external_id`, `source='pluggy'`, categoria nula, idempotente
- [ ] **4.3 Router `connections`** — list / register / sync / remove
- [ ] **4.4 Tela Conexões (web)** — conexões, status, última sync, "Sincronizar agora", "a revisar"
- [ ] **4.5 Tela Conexões (mobile)** — paridade no stack "Mais"
- [ ] **4.6 Revisão de importadas** — filtro "a revisar" no Histórico (web + mobile)
- [!] Dependência do usuário: conta meu.pluggy.ai + `PLUGGY_CLIENT_ID`/`PLUGGY_CLIENT_SECRET`

---

## Fase 5 — Polimento · `plan/05-polimento/`

- [x] **5.1 Auditoria do tema** — tokens consistentes nas duas plataformas, claro/escuro
- [x] **5.2 Edge cases** — mês vazio, sem categoria, sem due_date, parcela única, lista vazia, offline mobile, due_day 31 em mês curto, pasta arquivada, mês futuro
- [x] **5.3 Estados de erro/loading** — padronizados nos dois clientes + erros de sync visíveis
- [x] **5.4 Acessibilidade** — contraste AA nos dois temas (SC-103), foco, labels
- [~] **5.5 Verificação E2E** — SC-100/101 verificados ponta a ponta via API real (curl); passeio visual na web e no mobile fica com o Hugo (SC-102 depende da fase 4 adiada)

---

## Fase 6 — Backlog · `plan/06-backlog/`

- [ ] **6.1 Agente conversacional (AG-001)** — backend do agente; a tela já existe desde as fases 2/3
- [ ] **6.2 Superfície REST opcional (AG-002)** — `trpc-openapi` só para o agente, se necessário
- [ ] **6.3 iOS** — build iOS do mesmo código Expo
- [ ] **6.4 Open Finance pago** — migrar de Meu Pluggy para plano pago se o app virar produto

---

## Fase 7 — Fusão Início/Dashboard (DETALHADA) · `plan/07-fusao-inicio-dashboard/`

Entrega: rota `/dashboard` (web) e tab "Dash" (mobile) removidas; conteúdo unificado dentro da Início como seção de scroll com seletor de mês próprio.

- [x] **7.1–7.4 Web** · `01-web.md`
  - [x] 7.1 Hook `useMonthSummary` (web)
  - [x] 7.2 Componente `BalanceLineChart` (extraído do inline do Dashboard)
  - [x] 7.3 Componente `MonthChartsSection` (web)
  - [x] 7.4 Início unificada + remoção de `/dashboard` e do item de nav
- [x] **7.5–7.8 Mobile** · `02-mobile.md`
  - [x] 7.5 Hook `useMonthSummary` (mobile)
  - [x] 7.6 Componente `MonthSelector` (extraído do inline do Dash)
  - [x] 7.7 Componente `MonthChartsSection` (mobile)
  - [x] 7.8 Início unificada + remoção da tab "Dash" (5→4 tabs)

---

## Changelog do progresso

> Registre aqui marcos concluídos com data ISO.

- 2026-06-25: plano criado (mapa completo + fase 1 detalhada).
- 2026-07-06: brainstorming + protótipo visual aprovado; spec amendment (gastos fixos, pastas, Meu Pluggy, tela do agente, tema Nexforce); fases renumeradas (4=Pluggy, 5=Polimento, 6=Backlog).
- 2026-07-07: Fase 1 concluída — monorepo, packages (types/schemas/core, 42 testes), API Fastify+tRPC, Drizzle+Postgres (Docker local porta 5439), Better Auth (signup/login/sessão verificados via curl), fatia de transações com 8 testes (incl. isolamento A/B em pglite), workflows CI/Sonar criados (verificação no GitHub pendente de push).
- 2026-07-07: Fase 2 concluída — web Next.js completa (15 rotas): tema Nexforce claro/escuro, ui-web, auth, sidebar, Início, Histórico (filtros na URL), Categorias (seções), Gastos Fixos (toggle pago→transação, snapshot), Pastas (cards expansíveis), Cobranças, Faturas, Dashboard (Recharts), Agente estático. E2E SC-100/101 verificado via API real. Dev local na porta 3005 (3000 ocupada por outro projeto).
- 2026-07-07: Fase 3 concluída — mobile Expo/expo-router com paridade: auth por token (SecureStore + plugin expo no servidor), 5 tabs + stack Mais, FlashList com paginação infinita, gastos fixos com toggle, pastas expansíveis, cobranças/faturas com status inline, dashboard com gráficos SVG leves, agente estático. Build Android via EAS configurado (execução requer conta Expo).
- 2026-07-07: Fase 4 (Meu Pluggy) adiada por decisão do Hugo — telas "Conexões" permanecem como placeholder "em breve"; schema e ganchos (bank_connections, source, external_id) já prontos para quando for ativada.
- 2026-07-07: Fase 5 concluída — cores de gráfico resolvidas por tema (fix: var() não funciona em atributo SVG do Recharts), filtro de pasta no Histórico, confirmação ao excluir, monorepo alinhado em React 19 (mobile atualizado para Expo SDK 53 / RN 0.79, elimina conflito de tipos 18×19), .npmrc sem auto-install-peers. Gates: lint/typecheck/test(57)/build verdes em todos os pacotes.
- 2026-07-09: Paridade mobile + polimento — criar/excluir cobrança e fatura no mobile (installment-form-modal), CRUD de subcategorias e exclusão de categoria (category-block), confirmação destrutiva via Alert (lib/confirm), badge de status no InstallmentCard, Ionicons no lugar de emojis (tabs e menu Mais, @expo/vector-icons declarado para o pnpm estrito). Lógica de draft de installment movida de apps/web para @pmf/core (validateInstallmentDraft com RN-004 + formato de data). Gates verdes; web verificada em runtime (criar com vírgula, erro RN-004, excluir); bundle Metro compila com os módulos novos. Teste de toque no Expo Go pendente (aparelho).
- 2026-07-09: Paridade mobile completa — gastos fixos com editar/excluir e campo categoria (form extraído em fixed-expense-form.tsx, espelha FR-105), pastas com arquivar/reativar/excluir no card expandido, excluir transação no Histórico (TxRow com onDelete opcional; Início e Pastas seguem sem ação, como na web). Gates verdes; bundle Metro compila com os módulos novos. Toda ação destrutiva passa por confirmDelete.
- 2026-07-13: Fase 7 concluída — fusão Início/Dashboard nas duas plataformas: rota /dashboard e tab Dash removidas (mobile 5→4 tabs), seção "Gráficos por mês" (seletor de mês, KPIs, linha de saldo acumulado, barras) dentro da Início via scroll, com mês independente do topo. Duplicações eliminadas: hook useMonthSummary por plataforma (query dashboard.month era repetida em 4 arquivos), BalanceLineChart extraído do inline do Dashboard web, MonthSelector mobile extraído do inline do Dash. Specs emendadas (FR-003 reescrito, FR-006 removido, FR-151 sem Dashboard/Dash). Gates verdes (lint/typecheck/test 69/build); web verificada em runtime no navegador (seção renderiza, seletor muda só a seção de baixo, /dashboard → 404, nav sem o item); bundle Metro do mobile compila.
- 2026-07-13: Primeiro push para o GitHub — branch `feat/app-completo` (27 commits) e `main` criadas no remoto, PR #1 aberto; CI verde na primeira execução real (lint/typecheck/test/build em 2m33s). SonarCloud falhou por setup ausente (projeto não criado no sonarcloud.io + secret `SONAR_TOKEN`); adiado por decisão do Hugo — exige também tornar o repo público (plano gratuito). Pós-merge: trocar a branch default de `feat/app-completo` para `main` nas configurações do GitHub.
- 2026-07-13: App em produção — banco Neon criado (migration aplicada, 13 tabelas, seed dev pulado de propósito; Neon Auth desativado, o app usa Better Auth) e API no Render free tier via blueprint `render.yaml` (start via tsx pois o dist do tsc não é executável; migrations idempotentes no boot; BETTER_AUTH_URL automático; AUTH_BYPASS travado; cold start ~30-60s após 15min ocioso). APK Android gerado no EAS após fix de node-linker=hoisted (instalação isolada do pnpm quebrava o autolinking: PackageList com import expo.core inexistente); segundo build aponta para a API pública. Fix acessório: login/cadastro mobile com try/catch (falha de rede mostrava loading infinito). PRs #2 e #3 mergeados; dev local segue no Docker.
- 2026-07-13: Remodelagem da Início pós-fusão (fase 7) — repetições removidas: seletor de mês único no cabeçalho controlando a tela inteira (KPIs, gastos fixos e gráficos), fim do título "Gráficos por mês", dos 3 KPIs duplicados e do seletor da seção de baixo; no web o gráfico de barras aparece uma vez só (embaixo fica apenas a linha do saldo acumulado, alimentada pelo summary do topo, e month-charts-section.tsx foi removido); no mobile MonthChartsSection recebe month por prop e mantém linha + barras. Emendas registradas no design doc de 2026-07-10 e FR-003 reescrito.
- 2026-07-09: Perfil do usuário (web + mobile) e saudação — router tRPC `users` (me/updateName sobre a tabela users do Better Auth, funciona no bypass), tela /perfil na web (nome editável, email fixo, sair) e Mais → Perfil no mobile, rodapé da sidebar vira link de perfil com nome/email via users.me, "Bem-vindo, {primeiro nome}" nas telas iniciais (`firstName` puro em @pmf/core, com testes). Gates verdes; web verificada em runtime (salvar, erro "Informe o nome", saudação atualiza); bundle Metro compila com os módulos novos.
