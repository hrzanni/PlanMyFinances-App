# Tarefas 7.1–7.4 — Web: fundir Início e Dashboard

> Nota de execução: cada tarefa abaixo é para o Hugo escrever, com o assistente guiando em camadas (conceito → onde olhar → assinatura → código, revelando só o necessário). O código mostrado aqui é o alvo/gabarito para conferência, não para colar direto.

## Tarefa 7.1 — Hook `useMonthSummary`

Elimina a duplicação: hoje `trpc.dashboard.month.useQuery({ month })` é chamado do mesmo jeito em `page.tsx` e (até a 7.4) em `dashboard/page.tsx`.

**Files:**
- Create: `apps/web/src/hooks/use-month-summary.ts`
- Modify: `apps/web/src/app/(app)/page.tsx:18` (troca a chamada direta pelo hook)

**Interfaces:**
- Produces: `useMonthSummary(month: string)` — retorna o objeto de query do TanStack Query (mesmo shape que `trpc.dashboard.month.useQuery` já retorna: `.data`, `.isLoading`, etc.), para não quebrar nenhum consumo existente.

- [ ] **Passo 1: criar o hook**

```ts
// apps/web/src/hooks/use-month-summary.ts
import { trpc } from '@/lib/trpc'

export function useMonthSummary(month: string) {
  return trpc.dashboard.month.useQuery({ month })
}
```

- [ ] **Passo 2: usar o hook em `page.tsx`**

Troca, em `apps/web/src/app/(app)/page.tsx:18`:

```ts
const summary = trpc.dashboard.month.useQuery({ month })
```

por:

```ts
const summary = useMonthSummary(month)
```

(e adiciona o import `import { useMonthSummary } from '@/hooks/use-month-summary'`, removendo `trpc` se não sobrar outro uso — `page.tsx` ainda usa `trpc` para `transactions.list`, `fixedExpenses.list` e `users.me`, então o import de `trpc` continua.)

- [ ] **Passo 3: verificar**

Run: `pnpm --filter web typecheck && pnpm --filter web lint`
Expected: sem erros. Comportamento da Início não muda (mesmo dado, mesma UI).

- [ ] **Passo 4: commit**

```bash
git add apps/web/src/hooks/use-month-summary.ts apps/web/src/app/\(app\)/page.tsx
git commit -m "refactor(web): extrai hook useMonthSummary"
```

---

## Tarefa 7.2 — Componente `BalanceLineChart`

O gráfico de linha do Dashboard está inline em `dashboard/page.tsx:40-79`, sem componente próprio — inconsistente com `IncomeExpenseChart`, que já é componente. Extrair agora facilita a Tarefa 7.3 (vai ser consumido por `MonthChartsSection`).

**Files:**
- Create: `apps/web/src/components/balance-line-chart.tsx`

**Interfaces:**
- Consumes: `useChartColors()` de `@/lib/chart-colors` (já existe), `formatCurrency`/`formatDate` de `@pmf/core` (já existem).
- Produces: `BalanceLineChart({ daily }: { daily: Array<{ date: string; balance: number }> })`.

- [ ] **Passo 1: criar o componente**

Mover o JSX de `apps/web/src/app/(app)/dashboard/page.tsx:40-79` (o `<div className="h-56">...</div>` inteiro, com `ResponsiveContainer`/`LineChart`) para o novo arquivo, parametrizado por `daily`:

```tsx
// apps/web/src/components/balance-line-chart.tsx
'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatDate } from '@pmf/core'
import { useChartColors } from '@/lib/chart-colors'

export function BalanceLineChart({ daily }: { daily: Array<{ date: string; balance: number }> }) {
  const colors = useChartColors()
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.line} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(8)}
            tick={{ fontSize: 11, fill: colors.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            tick={{ fontSize: 11, fill: colors.muted }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(v: number | string) => formatCurrency(Number(v))}
            labelFormatter={(d) => formatDate(String(d))}
            contentStyle={{
              background: colors.surface,
              border: `1px solid ${colors.line}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Saldo"
            stroke={colors.navy}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Passo 2: verificar**

Run: `pnpm --filter web typecheck`
Expected: sem erros (componente novo, ainda não consumido — sem efeito visível até a 7.3).

- [ ] **Passo 3: commit**

```bash
git add apps/web/src/components/balance-line-chart.tsx
git commit -m "refactor(web): extrai BalanceLineChart do Dashboard inline"
```

---

## Tarefa 7.3 — Componente `MonthChartsSection`

Junta seletor de mês + KPIs do mês selecionado + os dois gráficos, exatamente como o Dashboard de hoje renderiza — só que como seção, não como página.

**Files:**
- Create: `apps/web/src/components/month-charts-section.tsx`

**Interfaces:**
- Consumes: `useMonthSummary` (7.1), `BalanceLineChart` (7.2), `MonthSelector` (`@/components/month-selector`, já existe), `IncomeExpenseChart` (`@/components/income-expense-chart`, já existe), `Kpi`/`Card`/`CardTitle`/`EmptyState`/`LoadingState` (`@pmf/ui-web`), `currentMonth`/`money`/`monthLabel` (`@/lib/format`).
- Produces: `MonthChartsSection()` — sem props, mês é estado interno (`useState(currentMonth)`), igual ao Dashboard atual.

- [ ] **Passo 1: criar o componente**

Corpo é o mesmo JSX de `dashboard/page.tsx` hoje (linhas 22-107), trocando `<PageHeader title="Dashboard">` por um cabeçalho de seção mais simples (sem duplicar o `<h1>` da página, já que agora é uma seção dentro da Início) e trocando o gráfico de linha inline pelo `<BalanceLineChart daily={daily} />`:

```tsx
// apps/web/src/components/month-charts-section.tsx
'use client'

import { useState } from 'react'
import { Card, CardTitle, EmptyState, Kpi, LoadingState } from '@pmf/ui-web'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { MonthSelector } from '@/components/month-selector'
import { IncomeExpenseChart } from '@/components/income-expense-chart'
import { BalanceLineChart } from '@/components/balance-line-chart'

export function MonthChartsSection() {
  const [month, setMonth] = useState(currentMonth)
  const summary = useMonthSummary(month)

  const daily = summary.data?.daily ?? []
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Gráficos por mês</h2>
        <MonthSelector month={month} onChange={setMonth} />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Kpi label="Receitas" value={money(summary.data?.income ?? 0)} tone="positive" />
        <Kpi label="Despesas" value={money(summary.data?.expense ?? 0)} tone="negative" />
        <Kpi label="Saldo" value={money(summary.data?.balance ?? 0)} />
      </div>

      {summary.isLoading ? (
        <LoadingState />
      ) : hasData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Saldo acumulado por dia</CardTitle>
            <BalanceLineChart daily={daily} />
          </Card>

          <Card>
            <CardTitle>Receitas × Despesas — {monthLabel(month)}</CardTitle>
            <IncomeExpenseChart
              income={summary.data?.income ?? 0}
              expense={summary.data?.expense ?? 0}
            />
            <div className="mt-2 flex gap-4 text-xs text-muted">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-positive" />
                Receitas
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-negative" />
                Despesas
              </span>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState
          title={`Sem transações em ${monthLabel(month)}`}
          hint="Os gráficos aparecem quando houver lançamentos no mês."
        />
      )}
    </section>
  )
}
```

- [ ] **Passo 2: verificar**

Run: `pnpm --filter web typecheck`
Expected: sem erros (ainda não consumido em nenhuma página — sem efeito visível até a 7.4).

- [ ] **Passo 3: commit**

```bash
git add apps/web/src/components/month-charts-section.tsx
git commit -m "feat(web): componente MonthChartsSection"
```

---

## Tarefa 7.4 — Unificar a Início, remover `/dashboard` e o item de nav

**Files:**
- Modify: `apps/web/src/app/(app)/page.tsx` (adiciona `<MonthChartsSection />` ao final)
- Delete: `apps/web/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/web/src/components/nav-items.tsx:14` (remove a entrada Dashboard)

**Interfaces:**
- Consumes: `MonthChartsSection` (7.3).

- [ ] **Passo 1: renderizar a seção na Início**

Em `apps/web/src/app/(app)/page.tsx`, importar `MonthChartsSection` e renderizá-la depois do `</div>` que fecha o grid de "Últimas transações" / "Receitas × Despesas" / "Gastos fixos" (linha 141), antes do `<TransactionForm />`:

```tsx
import { MonthChartsSection } from '@/components/month-charts-section'
// ...
      </div>

      <MonthChartsSection />

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} />
```

- [ ] **Passo 2: apagar a rota Dashboard**

```bash
git rm apps/web/src/app/\(app\)/dashboard/page.tsx
```

- [ ] **Passo 3: remover o item de navegação**

Em `apps/web/src/components/nav-items.tsx`, remover a linha `{ href: '/dashboard', label: 'Dashboard' }` de `mainItems`.

- [ ] **Passo 4: verificar**

Run: `pnpm --filter web typecheck && pnpm --filter web lint && pnpm --filter web build`
Expected: sem erros. `/dashboard` deixa de existir como rota (build não gera mais essa página).

- [ ] **Passo 5: passeio manual no navegador**

Com `pnpm --filter web dev` no ar:
1. Abrir `/` — confirmar que o topo está igual a antes, e que rolando aparece "Gráficos por mês" com seletor de mês, 3 KPIs, gráfico de linha e gráfico de barras.
2. Trocar o mês no seletor da seção nova — confirmar que só os KPIs/gráficos de baixo mudam, o topo continua no mês atual.
3. Acessar `/dashboard` direto na URL — confirmar 404.
4. Checar a sidebar (desktop) e o menu mobile (`☰`) — "Dashboard" não deve mais aparecer.

- [ ] **Passo 6: commit**

```bash
git add apps/web/src/app/\(app\)/page.tsx apps/web/src/components/nav-items.tsx
git commit -m "feat(web): funde Início e Dashboard numa única tela"
```
