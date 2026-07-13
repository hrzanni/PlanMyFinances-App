# Fase 7 — Fusão Início/Dashboard · Plano de Implementação

> **Modo de execução deste projeto:** implementação é do Hugo; o assistente guia (ver `CLAUDE.md`, "Papel: professor, não piloto automático"). Não se aplica superpowers:subagent-driven-development nem superpowers:executing-plans — os passos abaixo são para o Hugo executar com orientação em camadas, não para um subagente rodar sozinho.

**Goal:** eliminar a rota/tab "Dashboard" (web e mobile), unificando seu conteúdo (seletor de mês, KPIs do mês selecionado, gráfico de barras, gráfico de linha de saldo acumulado) dentro da tela "Início", como uma seção abaixo da existente, acessível por scroll.

**Architecture:** cada plataforma ganha um hook `useMonthSummary(month)` (wrapper fino sobre `trpc.dashboard.month.useQuery`) e um componente `MonthChartsSection` (seletor de mês próprio + KPIs + os dois gráficos). A tela Início passa a montar: seção fixa existente (mês atual, sem mudança de comportamento) + `<MonthChartsSection />`. A rota/tab Dashboard e sua entrada de navegação são removidas.

**Tech Stack:** igual às fases 2 (Next.js/Recharts/tRPC) e 3 (Expo/React Native/SVG puro) — nenhuma dependência nova.

## Global Constraints

- Máximo de **300 linhas por arquivo** (RE-001).
- **Modularização** (RE-002) e **DRY** (RE-003): esta fase existe para corrigir duplicação já identificada (query de resumo do mês repetida em 4 arquivos; seletor de mês do mobile reimplementado à mão; gráfico de linha do web sem componente próprio).
- Nenhuma lógica de negócio nova: os cálculos (`monthlyBalance`, `accumulatedBalanceByDay`) já existem em `packages/core` e no service `apps/api/src/services/summary.ts`; esta fase é só composição de UI.
- Idioma: código em EN; UI/commits em PT-BR.
- Antes de reportar cada tarefa pronta: `pnpm lint`, `pnpm typecheck`, `pnpm build` passam (não há suíte `pnpm test` em `apps/web`/`apps/mobile` hoje — é `echo no-tests` nos dois; não criar suíte nova como parte desta fase, é lógica de UI/composição, não de domínio).

## Contrato de dados (não muda)

`trpc.dashboard.month.useQuery({ month })` já retorna exatamente o que as duas seções precisam, sem cálculo adicional no cliente:

```ts
// apps/api/src/services/summary.ts — já existe, não muda nesta fase
{
  income: number
  expense: number
  balance: number
  incomeCount: number
  expenseCount: number
  daily: Array<{ date: string; balance: number }>
}
```

## Interfaces produzidas nesta fase

```ts
// apps/web/src/hooks/use-month-summary.ts
function useMonthSummary(month: string): ReturnType<typeof trpc.dashboard.month.useQuery>

// apps/web/src/components/balance-line-chart.tsx
function BalanceLineChart(props: { daily: Array<{ date: string; balance: number }> }): JSX.Element

// apps/web/src/components/month-charts-section.tsx
function MonthChartsSection(): JSX.Element   // sem props — mês é estado interno

// apps/mobile/src/hooks/use-month-summary.ts
function useMonthSummary(month: string): ReturnType<typeof trpc.dashboard.month.useQuery>

// apps/mobile/src/components/month-selector.tsx
function MonthSelector(props: { month: string; onChange: (month: string) => void }): JSX.Element

// apps/mobile/src/components/month-charts-section.tsx
function MonthChartsSection(): JSX.Element
```

## Subtarefas (ordem)

| # | Arquivo | Entrega testável |
|---|---|---|
| 7.1–7.4 | `01-web.md` | `/` mostra a seção de gráficos ao rolar; `/dashboard` deixa de existir; nav sem "Dashboard" |
| 7.5–7.8 | `02-mobile.md` | tab "Início" mostra a seção de gráficos ao rolar; tab "Dash" removida; 4 tabs no total |

## Definition of Done da fase

- Todas as subtarefas `[x]` no `run_tasks.md`.
- `pnpm lint && pnpm typecheck && pnpm build` verdes na raiz.
- Passeio manual no navegador (web) e no Expo Go/emulador (mobile): Início rola e mostra os dois gráficos abaixo do conteúdo atual; `/dashboard` (web) e a tab "Dash" (mobile) não existem mais.
- Specs atualizadas (já feito em 2026-07-10): FR-003 reescrito, FR-006 removido, FR-151 sem Dashboard/Dash.
- Changelog do `run_tasks.md` atualizado.
