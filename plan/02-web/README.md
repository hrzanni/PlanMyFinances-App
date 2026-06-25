# Fase 2 — Web (Next.js) · Mapa de tarefas

> Detalhe a nível de passos TDD será escrito quando a fase 1 fechar. Aqui ficam objetivo, entregáveis e dependências de cada subtarefa.

**Goal:** app web completo em `apps/web`, consumindo a API tRPC, com paridade em todos os domínios.

**Depende de:** Fase 1 completa (API, auth, `AppRouter` exportado, `packages/core` e `schemas`).

**Stack:** Next.js (App Router), Tailwind, shadcn/ui (`packages/ui-web`), cliente tRPC + TanStack Query.

**Princípio:** a web é só apresentação. Zero lógica de negócio aqui; cálculo vem de `@pmf/core`, validação de `@pmf/schemas`, dados via tRPC. Cumpre SC-002 (nenhum acesso direto ao banco).

| # | Subtarefa | Objetivo / entregável | Notas |
|---|---|---|---|
| 2.1 | Scaffold web | Next.js + Tailwind + provider tRPC/TanStack Query apontando para a API; tipos inferidos de `AppRouter` | base das demais |
| 2.2 | Auth web | Telas login/signup/forgot/reset; sessão por cookie; redirect de não autenticado e de autenticado em rota de auth (FR-064/065) | usa endpoints `/api/auth/*` |
| 2.3 | `packages/ui-web` | Button, Input, Select, Card, Dialog, Table, Tabs, Badge reutilizáveis (FR-091); formulários como Dialog (FR-092) | mata duplicação de estilo (RE-003/004) |
| 2.4 | Transações + Home | FR-001/002/003: Home com 5 últimas, 3 cards do mês, barra receitas×despesas; CRUD com filtro de categoria por tipo | consome `transactions.*` |
| 2.5 | Histórico | FR-004/005: lista + filtros cumulativos persistidos na URL + excluir | query params como fonte do filtro |
| 2.6 | Categorias/Subcategorias | FR-010/011/012: CRUD com cascade e SET NULL | novo router `categories` na API |
| 2.7 | Cobranças | FR-020..024: cards, tabela, status inline, validação `amount_paid` | novo router `charges` |
| 2.8 | Faturas + Assinaturas | FR-030..041: abas, cards, CRUD | novos routers `invoices`, `subscriptions` |
| 2.9 | Dashboard | FR-006: seletor de mês, cards, barra, linha de saldo acumulado (Recharts) | cálculos em `@pmf/core` |
| 2.10 | Layout/Navegação | FR-050: sidebar autenticada, responsividade (FR-094) | tema base |

> Observação: 2.6–2.8 exigem criar na API os routers e services dos domínios restantes (mesmo padrão da fatia vertical de transações da fase 1). Esses incrementos de API entram junto da subtarefa web correspondente.

**Definition of Done da fase:** todas as FRs de domínio acessíveis na web; `pnpm build` da web verde; CI/Sonar verdes; roteiro SC-009 passa na web.
