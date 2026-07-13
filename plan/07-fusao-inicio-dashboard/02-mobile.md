# Tarefas 7.5–7.8 — Mobile: fundir Início e Dash

> Nota de execução: mesma regra da 01-web.md — o Hugo escreve, o assistente guia em camadas. Código aqui é gabarito de conferência.

## Tarefa 7.5 — Hook `useMonthSummary`

Mesma duplicação do web, só que em `inicio.tsx` e (até a 7.8) `dash.tsx`.

**Files:**
- Create: `apps/mobile/src/hooks/use-month-summary.ts`
- Modify: `apps/mobile/app/(tabs)/inicio.tsx:15`

**Interfaces:**
- Produces: `useMonthSummary(month: string)` — mesmo shape de retorno do `trpc.dashboard.month.useQuery`.

- [ ] **Passo 1: criar o hook**

```ts
// apps/mobile/src/hooks/use-month-summary.ts
import { trpc } from '@/lib/trpc'

export function useMonthSummary(month: string) {
  return trpc.dashboard.month.useQuery({ month })
}
```

- [ ] **Passo 2: usar o hook em `inicio.tsx`**

Troca, em `apps/mobile/app/(tabs)/inicio.tsx:15`:

```ts
const summary = trpc.dashboard.month.useQuery({ month })
```

por:

```ts
const summary = useMonthSummary(month)
```

(adiciona `import { useMonthSummary } from '@/hooks/use-month-summary'`; `trpc` continua importado por causa de `transactions.list`, `fixedExpenses.list` e `users.me`.)

- [ ] **Passo 3: verificar**

Run: `pnpm --filter mobile typecheck && pnpm --filter mobile lint`
Expected: sem erros; comportamento da tela Início não muda.

- [ ] **Passo 4: commit**

```bash
git add apps/mobile/src/hooks/use-month-summary.ts "apps/mobile/app/(tabs)/inicio.tsx"
git commit -m "refactor(mobile): extrai hook useMonthSummary"
```

---

## Tarefa 7.6 — Componente `MonthSelector`

O seletor de mês do Dash mobile é reimplementado à mão (`dash.tsx:19-29`), diferente do web que já tem `MonthSelector` como componente. Extrair agora.

**Files:**
- Create: `apps/mobile/src/components/month-selector.tsx`

**Interfaces:**
- Consumes: `addMonths`/`monthLabel` de `@/lib/format` (já existem).
- Produces: `MonthSelector({ month, onChange }: { month: string; onChange: (month: string) => void })` — mesma assinatura de props do `MonthSelector` web, por consistência entre plataformas.

- [ ] **Passo 1: criar o componente**

Extraído do bloco `<View className="mb-3 ...">...</View>` de `apps/mobile/app/(tabs)/dash.tsx:19-29`:

```tsx
// apps/mobile/src/components/month-selector.tsx
import { Pressable, Text, View } from 'react-native'
import { addMonths, monthLabel } from '@/lib/format'

export function MonthSelector({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  return (
    <View className="mb-3 flex-row items-center justify-center gap-4 rounded-lg border border-line bg-surface py-2 dark:border-line-dark dark:bg-surface-dark">
      <Pressable onPress={() => onChange(addMonths(month, -1))} accessibilityLabel="Mês anterior">
        <Text className="px-3 text-muted dark:text-muted-dark">◀</Text>
      </Pressable>
      <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
        {monthLabel(month)}
      </Text>
      <Pressable onPress={() => onChange(addMonths(month, 1))} accessibilityLabel="Próximo mês">
        <Text className="px-3 text-muted dark:text-muted-dark">▶</Text>
      </Pressable>
    </View>
  )
}
```

- [ ] **Passo 2: verificar**

Run: `pnpm --filter mobile typecheck`
Expected: sem erros (ainda não consumido — sem efeito visível até a 7.7).

- [ ] **Passo 3: commit**

```bash
git add apps/mobile/src/components/month-selector.tsx
git commit -m "refactor(mobile): extrai componente MonthSelector"
```

---

## Tarefa 7.7 — Componente `MonthChartsSection`

**Files:**
- Create: `apps/mobile/src/components/month-charts-section.tsx`

**Interfaces:**
- Consumes: `useMonthSummary` (7.5), `MonthSelector` (7.6), `BarsChart`/`BalanceLineChart` (`@/components/charts`, já existem), `Kpi`/`Card`/`EmptyState` (`@/components/ui`), `currentMonth`/`money`/`monthLabel` (`@/lib/format`).
- Produces: `MonthChartsSection()` — sem props, mês é estado interno.

- [ ] **Passo 1: criar o componente**

Mesmo conteúdo de `dash.tsx` hoje (linhas 17-59), troca o seletor manual pelo `<MonthSelector />` e adiciona um título de seção (já que deixa de ser tela própria):

```tsx
// apps/mobile/src/components/month-charts-section.tsx
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { Card, EmptyState, Kpi } from '@/components/ui'
import { MonthSelector } from '@/components/month-selector'
import { BalanceLineChart, BarsChart } from '@/components/charts'

export function MonthChartsSection() {
  const [month, setMonth] = useState(currentMonth)
  const summary = useMonthSummary(month)
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <View className="mt-6">
      <Text className="mb-2 text-base font-bold text-foreground dark:text-foreground-dark">
        Gráficos por mês
      </Text>

      <MonthSelector month={month} onChange={setMonth} />

      <View className="mb-2 flex-row gap-2">
        <Kpi label="Receitas" value={money(summary.data?.income ?? 0)} tone="positive" />
        <Kpi label="Despesas" value={money(summary.data?.expense ?? 0)} tone="negative" />
      </View>
      <View className="mb-4">
        <Kpi label="Saldo" value={money(summary.data?.balance ?? 0)} />
      </View>

      {hasData ? (
        <>
          <Card className="mb-4">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
              Saldo acumulado por dia
            </Text>
            <BalanceLineChart daily={summary.data?.daily ?? []} />
          </Card>
          <Card className="mb-8">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
              Receitas × Despesas
            </Text>
            <BarsChart income={summary.data?.income ?? 0} expense={summary.data?.expense ?? 0} />
          </Card>
        </>
      ) : (
        <EmptyState
          title={`Sem transações em ${monthLabel(month)}`}
          hint="Os gráficos aparecem quando houver lançamentos."
        />
      )}
    </View>
  )
}
```

- [ ] **Passo 2: verificar**

Run: `pnpm --filter mobile typecheck`
Expected: sem erros (ainda não consumido em nenhuma tela — sem efeito visível até a 7.8).

- [ ] **Passo 3: commit**

```bash
git add apps/mobile/src/components/month-charts-section.tsx
git commit -m "feat(mobile): componente MonthChartsSection"
```

---

## Tarefa 7.8 — Unificar a Início, remover a tab "Dash"

**Files:**
- Modify: `apps/mobile/app/(tabs)/inicio.tsx` (adiciona `<MonthChartsSection />` ao final do `ScrollView`)
- Delete: `apps/mobile/app/(tabs)/dash.tsx`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx:23,64-72` (remove a `Tabs.Screen name="dash"` e atualiza o comentário "5 tabs" → "4 tabs")

**Interfaces:**
- Consumes: `MonthChartsSection` (7.7).

- [ ] **Passo 1: renderizar a seção na Início**

Em `apps/mobile/app/(tabs)/inicio.tsx`, importar `MonthChartsSection` e renderizá-la depois do `<Card className="mb-8 mt-4">` de "Gastos fixos do mês" (linha 76), antes do `</ScrollView>`:

```tsx
import { MonthChartsSection } from '@/components/month-charts-section'
// ...
        </Card>

        <MonthChartsSection />
      </ScrollView>
```

- [ ] **Passo 2: apagar a tela Dash**

```bash
git rm "apps/mobile/app/(tabs)/dash.tsx"
```

- [ ] **Passo 3: remover a tab da navegação**

Em `apps/mobile/app/(tabs)/_layout.tsx`:
- Remover o bloco `<Tabs.Screen name="dash" ... />` (linhas 64-72).
- Trocar o comentário da linha 23 de `/** 5 tabs (FR-151). Guard: sem sessão → login. */` para `/** 4 tabs (FR-151). Guard: sem sessão → login. */`.

- [ ] **Passo 4: verificar**

Run: `pnpm --filter mobile typecheck && pnpm --filter mobile lint`
Expected: sem erros.

- [ ] **Passo 5: passeio manual no Expo Go/emulador**

Com `pnpm --filter mobile start` no ar:
1. Abrir a tab "Início" — confirmar que o topo está igual a antes, e que rolando aparece "Gráficos por mês" com seletor de mês, KPIs e os dois gráficos.
2. Trocar o mês no seletor — confirmar que só a seção de baixo muda.
3. Confirmar que a barra de tabs mostra 4 abas (Início, Histórico, Fixos, Mais), sem "Dash".

- [ ] **Passo 6: commit**

```bash
git add "apps/mobile/app/(tabs)/inicio.tsx" "apps/mobile/app/(tabs)/_layout.tsx"
git commit -m "feat(mobile): funde Início e Dash numa única tela"
```
