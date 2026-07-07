# Fase 2 — Web (Next.js) · Mapa de tarefas

> Detalhe a nível de passos TDD será escrito quando a fase 1 fechar. Aqui ficam objetivo, entregáveis e dependências de cada subtarefa.

**Goal:** app web completo em `apps/web`, consumindo a API tRPC, com paridade em todos os domínios.

**Depende de:** Fase 1 completa (API, auth, `AppRouter` exportado, `packages/core` e `schemas`).

**Stack:** Next.js (App Router), Tailwind, shadcn/ui (`packages/ui-web`), cliente tRPC + TanStack Query.

**Princípio:** a web é só apresentação. Zero lógica de negócio aqui; cálculo vem de `@pmf/core`, validação de `@pmf/schemas`, dados via tRPC. Cumpre SC-002 (nenhum acesso direto ao banco).

**Referência visual obrigatória:** protótipo aprovado em `docs/mockups/planmyfinances-telas.html` + tema Nexforce (spec amendment 2026-07-06, seção 6).

| # | Subtarefa | Objetivo / entregável | Notas |
|---|---|---|---|
| 2.1 | Scaffold web | Next.js + Tailwind + provider tRPC/TanStack Query apontando para a API; tipos inferidos de `AppRouter` | base das demais |
| 2.2 | Tema Nexforce + `packages/ui-web` | Tokens claro/escuro (CSS variables + next-themes) da paleta Nexforce; Lato; Button, Input, Select, Card, Dialog, Table, Tabs, Badge, Toggle (FR-091/150); formulários como Dialog (FR-092) | mata duplicação de estilo (RE-003/004) |
| 2.3 | Auth web | Telas login/signup/forgot/reset; sessão por cookie; redirect de não autenticado e de autenticado em rota de auth (FR-064/065) | usa endpoints `/api/auth/*` |
| 2.4 | Layout/Navegação | FR-050/151: sidebar escura com grupos (principal, Contas, Automação), responsividade (FR-094), item Agente "Em breve" | conforme protótipo |
| 2.5 | Transações + Home | FR-001/002/003/107: Home com 5 últimas, 3 cards do mês, barra receitas×despesas, widget gastos fixos; CRUD com filtro de categoria por tipo e campo Pasta (FR-111) | consome `transactions.*` |
| 2.6 | Histórico | FR-004/005/113/125: lista + filtros cumulativos persistidos na URL + excluir + badges de origem e pasta | query params como fonte do filtro |
| 2.7 | Categorias/Subcategorias | FR-010/011/012/140: CRUD com cascade e SET NULL, seções Despesas × Receitas separadas | novo router `categories` na API |
| 2.8 | Gastos Fixos | FR-100..107: seletor de mês, 3 cards, tabela com toggle pago (cria/remove transação), snapshot de valor, estados pago/pendente/vencido | novos routers `fixedExpenses` |
| 2.9 | Pastas | FR-110..113: cards expansíveis com total gasto e transações dentro do card | novo router `folders` |
| 2.10 | Cobranças | FR-020..024: cards, tabela, status inline, validação `amount_paid` | novo router `charges` |
| 2.11 | Faturas | FR-030..032: cards, tabela, CRUD | novo router `invoices` |
| 2.12 | Dashboard | FR-006: seletor de mês, cards, barra, linha de saldo acumulado (Recharts, navy `#303F63`) | cálculos em `@pmf/core` |
| 2.13 | Tela do Agente | FR-130/131: chat estático "Em breve", input desabilitado | sem backend |

> Observação: 2.7–2.11 exigem criar na API os routers e services dos domínios restantes (mesmo padrão da fatia vertical de transações da fase 1). Esses incrementos de API entram junto da subtarefa web correspondente. A tela Conexões (Pluggy) fica na fase 4.

**Definition of Done da fase:** todas as FRs de domínio acessíveis na web; `pnpm build` da web verde; CI/Sonar verdes; roteiro SC-009 (estendido com SC-100/101) passa na web.
