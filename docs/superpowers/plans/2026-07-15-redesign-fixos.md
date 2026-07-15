# Redesign da tela Fixos + widget "Fixos do mês" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a "Agenda de vencimentos" (variante C) na tela Fixos e o widget combinado (mini agenda + progresso) na Início, com paridade web/mobile, conforme `docs/superpowers/specs/2026-07-15-redesign-fixos-design.md`.

**Architecture:** Nenhuma mudança de backend — `fixedExpenses.list` já devolve `items` (com `type`, `dueDay`, `monthlyStatus`, `payment`) e `totals` por tipo. Lógica nova (saldo fixo, pendências, agrupamento por dia, labels relativas, próximas pendências) vira funções puras em `packages/core` com testes; web e mobile ganham componentes de apresentação que as consomem.

**Tech Stack:** pnpm + Turborepo; Next.js + Tailwind (`@pmf/ui-web`); Expo/React Native + NativeWind; tRPC + TanStack Query; Vitest no core.

## Global Constraints

- Máximo de **300 linhas por arquivo**; quebrar em módulos ao ultrapassar.
- Lógica de negócio é função pura em `packages/core`, sem banco/framework/rede.
- Código em EN; UI, commits e docs em PT-BR.
- Somente tokens do tema Nexforce (`positive`/`negative`/`attention`/`info`/`line`/`surface`/`muted`...); no mobile, todo token tem a variante `dark:*-dark`.
- Gates antes de declarar pronto: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Branch de trabalho: `feat/fase8-redesign-fixos` (já criada). Commits por task, sem push.
- Datas "hoje" no cliente: `new Date().toISOString().slice(0, 10)` (mesmo padrão do `invoices-month-widget`).

---

### Task 1: Core — helpers puros da agenda de fixos

**Files:**
- Create: `packages/core/src/fixed-schedule.ts`
- Create: `packages/core/src/fixed-schedule.test.ts`
- Modify: `packages/core/src/index.ts` (adicionar `export * from './fixed-schedule'`)

**Interfaces:**
- Consumes: `effectiveDueDate(dueDay, monthIso)` de `./date`; `sumAmounts(values)` de `./money`; `FixedExpenseTotals` de `./fixed-expenses`; `MonthlyExpenseStatus` de `@pmf/types`.
- Produces (usado pelas Tasks 2–6):
  - `fixedBalance(totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals }): number`
  - `fixedPendingSummary(items: Array<{ monthlyStatus: MonthlyExpenseStatus; amount: string }>): { count: number; amount: number }`
  - `groupFixedByDueDay<T extends { dueDay: number }>(items: T[]): Array<{ dueDay: number; items: T[] }>`
  - `fixedDueInfo(dueDay: number, month: string /* YYYY-MM */, today: string /* YYYY-MM-DD */): { kind: 'late' | 'today' | 'upcoming' | 'other-month'; days: number }`
  - `nextPendingFixed<T extends { dueDay: number; monthlyStatus: MonthlyExpenseStatus }>(items: T[], limit?: number): T[]`
  - `fixedDueBadge(item: { type: 'despesa' | 'receita'; dueDay: number; monthlyStatus: MonthlyExpenseStatus; paidAt: string | null }, month: string, today: string): { tone: 'paid' | 'pending' | 'late'; label: string }`

- [ ] **Step 1: Escrever os testes (falhando)**

`packages/core/src/fixed-schedule.test.ts` (estilo dos testes existentes do core, Vitest):

```ts
import { describe, expect, it } from 'vitest'
import {
  fixedBalance,
  fixedDueBadge,
  fixedDueInfo,
  fixedPendingSummary,
  groupFixedByDueDay,
  nextPendingFixed,
} from './fixed-schedule'

const totals = {
  expense: { total: 2281.1, paid: 1899.9, pending: 381.2 },
  income: { total: 10650, paid: 9450, pending: 1200 },
}

describe('fixedBalance', () => {
  it('receitas menos despesas com precisão de centavos', () => {
    expect(fixedBalance(totals)).toBe(8368.9)
  })
  it('negativo quando despesas superam receitas', () => {
    expect(fixedBalance({ expense: { total: 100.1, paid: 0, pending: 100.1 }, income: { total: 50, paid: 0, pending: 50 } })).toBe(-50.1)
  })
})

describe('fixedPendingSummary', () => {
  it('conta e soma apenas itens não pagos', () => {
    const items = [
      { monthlyStatus: 'pago' as const, amount: '100.00' },
      { monthlyStatus: 'vencido' as const, amount: '89.90' },
      { monthlyStatus: 'pendente' as const, amount: '235.40' },
    ]
    expect(fixedPendingSummary(items)).toEqual({ count: 2, amount: 325.3 })
  })
  it('zero pendências', () => {
    expect(fixedPendingSummary([{ monthlyStatus: 'pago' as const, amount: '10.00' }])).toEqual({ count: 0, amount: 0 })
  })
})

describe('groupFixedByDueDay', () => {
  it('agrupa por dia crescente preservando a ordem interna', () => {
    const items = [
      { dueDay: 10, name: 'b' },
      { dueDay: 5, name: 'a' },
      { dueDay: 10, name: 'c' },
    ]
    expect(groupFixedByDueDay(items)).toEqual([
      { dueDay: 5, items: [{ dueDay: 5, name: 'a' }] },
      { dueDay: 10, items: [{ dueDay: 10, name: 'b' }, { dueDay: 10, name: 'c' }] },
    ])
  })
})

describe('fixedDueInfo', () => {
  it('other-month quando o mês exibido não é o corrente', () => {
    expect(fixedDueInfo(10, '2026-06', '2026-07-15')).toEqual({ kind: 'other-month', days: 0 })
  })
  it('late com dias de atraso', () => {
    expect(fixedDueInfo(8, '2026-07', '2026-07-15')).toEqual({ kind: 'late', days: 7 })
  })
  it('today no dia do vencimento', () => {
    expect(fixedDueInfo(15, '2026-07', '2026-07-15')).toEqual({ kind: 'today', days: 0 })
  })
  it('upcoming com dias restantes', () => {
    expect(fixedDueInfo(20, '2026-07', '2026-07-15')).toEqual({ kind: 'upcoming', days: 5 })
  })
  it('dueDay 31 em mês de 30 dias usa o vencimento efetivo', () => {
    expect(fixedDueInfo(31, '2026-06', '2026-06-30')).toEqual({ kind: 'today', days: 0 })
  })
})

describe('nextPendingFixed', () => {
  const items = [
    { dueDay: 1, monthlyStatus: 'pago' as const },
    { dueDay: 8, monthlyStatus: 'vencido' as const },
    { dueDay: 15, monthlyStatus: 'pendente' as const },
    { dueDay: 20, monthlyStatus: 'pendente' as const },
    { dueDay: 25, monthlyStatus: 'pendente' as const },
  ]
  it('só não pagos, por dia crescente, limitado a 3 por padrão', () => {
    expect(nextPendingFixed(items).map((i) => i.dueDay)).toEqual([8, 15, 20])
  })
  it('respeita limit menor que o total', () => {
    expect(nextPendingFixed(items, 2).map((i) => i.dueDay)).toEqual([8, 15])
  })
})

describe('fixedDueBadge', () => {
  it('pago com data curta e verbo por tipo', () => {
    expect(fixedDueBadge({ type: 'despesa', dueDay: 5, monthlyStatus: 'pago', paidAt: '2026-07-05' }, '2026-07', '2026-07-15')).toEqual({ tone: 'paid', label: 'Pago em 05/07' })
    expect(fixedDueBadge({ type: 'receita', dueDay: 1, monthlyStatus: 'pago', paidAt: '2026-07-01' }, '2026-07', '2026-07-15')).toEqual({ tone: 'paid', label: 'Recebido em 01/07' })
  })
  it('vencido relativo no mês corrente, absoluto fora dele', () => {
    expect(fixedDueBadge({ type: 'despesa', dueDay: 8, monthlyStatus: 'vencido', paidAt: null }, '2026-07', '2026-07-15')).toEqual({ tone: 'late', label: 'Vencido há 7 dias' })
    expect(fixedDueBadge({ type: 'despesa', dueDay: 14, monthlyStatus: 'vencido', paidAt: null }, '2026-07', '2026-07-15')).toEqual({ tone: 'late', label: 'Vencido há 1 dia' })
    expect(fixedDueBadge({ type: 'despesa', dueDay: 8, monthlyStatus: 'vencido', paidAt: null }, '2026-06', '2026-07-15')).toEqual({ tone: 'late', label: 'Vencido' })
  })
  it('pendente: hoje, amanhã, em N dias, e fora do mês corrente', () => {
    expect(fixedDueBadge({ type: 'despesa', dueDay: 15, monthlyStatus: 'pendente', paidAt: null }, '2026-07', '2026-07-15')).toEqual({ tone: 'pending', label: 'Vence hoje' })
    expect(fixedDueBadge({ type: 'despesa', dueDay: 16, monthlyStatus: 'pendente', paidAt: null }, '2026-07', '2026-07-15')).toEqual({ tone: 'pending', label: 'Amanhã' })
    expect(fixedDueBadge({ type: 'despesa', dueDay: 20, monthlyStatus: 'pendente', paidAt: null }, '2026-07', '2026-07-15')).toEqual({ tone: 'pending', label: 'Em 5 dias' })
    expect(fixedDueBadge({ type: 'despesa', dueDay: 20, monthlyStatus: 'pendente', paidAt: null }, '2026-08', '2026-07-15')).toEqual({ tone: 'pending', label: 'Pendente' })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @pmf/core test`
Expected: FAIL — `Cannot find module './fixed-schedule'` (ou equivalente).

- [ ] **Step 3: Implementar `packages/core/src/fixed-schedule.ts`**

```ts
import type { MonthlyExpenseStatus } from '@pmf/types'
import { effectiveDueDate } from './date'
import type { FixedExpenseTotals } from './fixed-expenses'
import { sumAmounts } from './money'

export type FixedDueKind = 'late' | 'today' | 'upcoming' | 'other-month'

export interface FixedDueInfo {
  kind: FixedDueKind
  days: number
}

/** Saldo fixo do mês (receitas − despesas), com precisão de centavos. */
export function fixedBalance(totals: {
  expense: FixedExpenseTotals
  income: FixedExpenseTotals
}): number {
  return Math.round((totals.income.total - totals.expense.total) * 100) / 100
}

/** Pendências do mês exibido: contagem e soma dos valores vigentes não pagos. */
export function fixedPendingSummary(
  items: Array<{ monthlyStatus: MonthlyExpenseStatus; amount: string }>,
): { count: number; amount: number } {
  const pending = items.filter((i) => i.monthlyStatus !== 'pago')
  return { count: pending.length, amount: sumAmounts(pending.map((i) => i.amount)) }
}

/** Agrupa itens por dia de vencimento crescente (linha do tempo), estável dentro do dia. */
export function groupFixedByDueDay<T extends { dueDay: number }>(
  items: T[],
): Array<{ dueDay: number; items: T[] }> {
  const groups = new Map<number, T[]>()
  for (const item of [...items].sort((a, b) => a.dueDay - b.dueDay)) {
    const bucket = groups.get(item.dueDay)
    if (bucket) bucket.push(item)
    else groups.set(item.dueDay, [item])
  }
  return [...groups.entries()].map(([dueDay, grouped]) => ({ dueDay, items: grouped }))
}

const DAY_MS = 86_400_000

/** Posição do vencimento em relação a hoje; relativa só quando o mês exibido é o corrente. */
export function fixedDueInfo(dueDay: number, month: string, today: string): FixedDueInfo {
  if (today.slice(0, 7) !== month) return { kind: 'other-month', days: 0 }
  const due = effectiveDueDate(dueDay, `${month}-01`)
  const days = Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS)
  if (days < 0) return { kind: 'late', days: -days }
  if (days === 0) return { kind: 'today', days: 0 }
  return { kind: 'upcoming', days }
}

/** Próximas pendências por dia crescente (vencidos primeiro), para a mini agenda. */
export function nextPendingFixed<T extends { dueDay: number; monthlyStatus: MonthlyExpenseStatus }>(
  items: T[],
  limit = 3,
): T[] {
  return items
    .filter((i) => i.monthlyStatus !== 'pago')
    .sort((a, b) => a.dueDay - b.dueDay)
    .slice(0, limit)
}

function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

/** Badge de status do item na agenda: tom + rótulo pt-BR (relativo no mês corrente). */
export function fixedDueBadge(
  item: {
    type: 'despesa' | 'receita'
    dueDay: number
    monthlyStatus: MonthlyExpenseStatus
    paidAt: string | null
  },
  month: string,
  today: string,
): { tone: 'paid' | 'pending' | 'late'; label: string } {
  if (item.monthlyStatus === 'pago') {
    const verb = item.type === 'receita' ? 'Recebido' : 'Pago'
    return { tone: 'paid', label: item.paidAt ? `${verb} em ${shortDate(item.paidAt)}` : verb }
  }
  const info = fixedDueInfo(item.dueDay, month, today)
  if (item.monthlyStatus === 'vencido') {
    if (info.kind === 'late') {
      return {
        tone: 'late',
        label: info.days === 1 ? 'Vencido há 1 dia' : `Vencido há ${info.days} dias`,
      }
    }
    return { tone: 'late', label: 'Vencido' }
  }
  if (info.kind === 'today') return { tone: 'pending', label: 'Vence hoje' }
  if (info.kind === 'upcoming') {
    return { tone: 'pending', label: info.days === 1 ? 'Amanhã' : `Em ${info.days} dias` }
  }
  return { tone: 'pending', label: 'Pendente' }
}
```

E em `packages/core/src/index.ts`, adicionar na lista de exports:

```ts
export * from './fixed-schedule'
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm --filter @pmf/core test`
Expected: PASS (todos os testes, incluindo os pré-existentes).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/fixed-schedule.ts packages/core/src/fixed-schedule.test.ts packages/core/src/index.ts
git commit -m "feat(fixos): helpers puros da agenda de vencimentos no core"
```

---

### Task 2: Web — peças visuais da agenda (ícones, bolinha do dia, KPIs, pills)

**Files:**
- Create: `apps/web/src/components/fixed/timeline-bits.tsx`
- Create: `apps/web/src/components/fixed/fixed-kpis.tsx`
- Create: `apps/web/src/components/fixed/type-filter-pills.tsx`

**Interfaces:**
- Consumes: `fixedBalance` (Task 1); `money` de `@/lib/format`.
- Produces (usado nas Tasks 3–4):
  - `TypeIcon({ type }: { type: 'despesa' | 'receita' })`
  - `DayDot({ day, monthAbbr, today }: { day: number; monthAbbr: string; today?: boolean })`
  - `FixedKpis({ totals, pending })` — `totals` é `{ expense: FixedExpenseTotals; income: FixedExpenseTotals } | undefined`, `pending` é `{ count: number; amount: number }`
  - `TypeFilterPills({ value, onChange, counts })` e o tipo `FixedTypeFilter = 'todos' | 'despesa' | 'receita'`

- [ ] **Step 1: Criar `timeline-bits.tsx`**

```tsx
/** Peças compartilhadas da agenda de fixos (timeline da tela + widget da Início). */

export function TypeIcon({ type }: { type: 'despesa' | 'receita' }) {
  const income = type === 'receita'
  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
        income ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {income ? <path d="M7 17L17 7M17 7H9M17 7v8" /> : <path d="M7 7l10 10M17 17H9M17 17V9" />}
      </svg>
    </span>
  )
}

export function DayDot({
  day,
  monthAbbr,
  today = false,
}: {
  day: number
  monthAbbr: string
  today?: boolean
}) {
  return (
    <span
      className={`flex h-11 w-11 flex-none flex-col items-center justify-center rounded-full border text-sm font-black leading-none ${
        today
          ? 'border-foreground bg-foreground text-background'
          : 'border-line bg-background text-foreground'
      }`}
    >
      {String(day).padStart(2, '0')}
      <span
        className={`mt-0.5 text-[8px] font-bold uppercase leading-none ${
          today ? 'text-background/70' : 'text-muted'
        }`}
      >
        {today ? 'hoje' : monthAbbr}
      </span>
    </span>
  )
}
```

- [ ] **Step 2: Criar `fixed-kpis.tsx`**

```tsx
import { fixedBalance, type FixedExpenseTotals } from '@pmf/core'
import { money } from '@/lib/format'

interface FixedKpisProps {
  totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals } | undefined
  pending: { count: number; amount: number }
}

/** Faixa única de 4 KPIs da tela Fixos (despesas, receitas, saldo fixo, pendências). */
export function FixedKpis({ totals, pending }: FixedKpisProps) {
  const balance = totals ? fixedBalance(totals) : 0
  const cells = [
    { label: 'Despesas fixas', value: money(totals?.expense.total ?? 0), cls: 'text-foreground' },
    { label: 'Receitas fixas', value: money(totals?.income.total ?? 0), cls: 'text-foreground' },
    {
      label: 'Saldo fixo do mês',
      value: `${balance < 0 ? '−' : '+'}${money(Math.abs(balance))}`,
      cls: balance < 0 ? 'text-negative' : 'text-positive',
    },
    {
      label: 'Pendências',
      value:
        pending.count === 0
          ? 'Tudo em dia ✓'
          : `${pending.count} ${pending.count === 1 ? 'item' : 'itens'} · ${money(pending.amount)}`,
      cls: pending.count === 0 ? 'text-positive' : 'text-negative',
    },
  ]
  return (
    <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-4 md:divide-x md:divide-line">
      {cells.map((cell) => (
        <div key={cell.label} className="px-4 py-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {cell.label}
          </div>
          <div className={`mt-1 truncate text-lg font-black tabular-nums ${cell.cls}`}>
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Criar `type-filter-pills.tsx`**

```tsx
export type FixedTypeFilter = 'todos' | 'despesa' | 'receita'

interface TypeFilterPillsProps {
  value: FixedTypeFilter
  onChange: (value: FixedTypeFilter) => void
  counts: Record<FixedTypeFilter, number>
}

/** Filtro segmentado Todos/Despesas/Receitas com contagens (substitui o Select). */
export function TypeFilterPills({ value, onChange, counts }: TypeFilterPillsProps) {
  const options: Array<{ key: FixedTypeFilter; label: string }> = [
    { key: 'todos', label: 'Todos' },
    { key: 'despesa', label: 'Despesas' },
    { key: 'receita', label: 'Receitas' },
  ]
  return (
    <div className="mb-3 inline-flex gap-1 rounded-full border border-line bg-surface p-1">
      {options.map((option) => {
        const active = value === option.key
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              active ? 'bg-foreground text-background' : 'text-body hover:text-foreground'
            }`}
          >
            {option.label} <span className={active ? 'opacity-60' : 'text-muted'}>{counts[option.key]}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `pnpm --filter web lint && pnpm --filter web typecheck`
Expected: PASS (componentes ainda não usados; sem erros).
(Se os scripts por app não existirem, rodar `pnpm lint && pnpm typecheck` na raiz.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/fixed/
git commit -m "feat(fixos): KPIs em faixa, pills de filtro e peças da agenda na web"
```

---

### Task 3: Web — linha do tempo e reescrita da página Fixos

**Files:**
- Create: `apps/web/src/components/fixed/fixed-timeline.tsx`
- Modify: `apps/web/src/app/(app)/gastos-fixos/page.tsx` (reescrita: sai Tabela/Select/KPIs duplos, entram FixedKpis/TypeFilterPills/FixedTimeline)

**Interfaces:**
- Consumes: Task 1 (`groupFixedByDueDay`, `fixedDueInfo`, `fixedDueBadge`, `fixedPendingSummary`), Task 2 (`TypeIcon`, `DayDot`, `FixedKpis`, `TypeFilterPills`, `FixedTypeFilter`); `Badge`, `Toggle`, `Card`, `EmptyState`, `ErrorState`, `LoadingState`, `Button` de `@pmf/ui-web`; `money`, `monthLabel`, `currentMonth` de `@/lib/format`; `trpc`; `FixedExpenseForm` existente.
- Produces: `FixedTimeline({ items, month, today, monthAbbr, categoryNames, mutating, onToggle, onEdit, onDelete })` com

```ts
export interface FixedTimelineItemData {
  id: string
  name: string
  type: 'despesa' | 'receita'
  amount: string
  dueDay: number
  categoryId: string | null
  monthlyStatus: 'pago' | 'pendente' | 'vencido'
  payment: { amount: string; paidAt: string } | null
}
```

- [ ] **Step 1: Criar `fixed-timeline.tsx`**

```tsx
import { fixedDueBadge, fixedDueInfo, groupFixedByDueDay } from '@pmf/core'
import { Badge, Toggle } from '@pmf/ui-web'
import { money } from '@/lib/format'
import { DayDot, TypeIcon } from './timeline-bits'

export interface FixedTimelineItemData {
  id: string
  name: string
  type: 'despesa' | 'receita'
  amount: string
  dueDay: number
  categoryId: string | null
  monthlyStatus: 'pago' | 'pendente' | 'vencido'
  payment: { amount: string; paidAt: string } | null
}

interface FixedTimelineProps {
  items: FixedTimelineItemData[]
  /** Mês exibido, YYYY-MM. */
  month: string
  /** Hoje, YYYY-MM-DD. */
  today: string
  /** Abreviação do mês exibido para as bolinhas (ex.: "jul"). */
  monthAbbr: string
  categoryNames: Map<string, string>
  mutating: boolean
  onToggle: (item: FixedTimelineItemData, next: boolean) => void
  onEdit: (item: FixedTimelineItemData) => void
  onDelete: (item: FixedTimelineItemData) => void
}

/** Linha do tempo do mês: grupos por dia de vencimento com trilho à esquerda. */
export function FixedTimeline(props: FixedTimelineProps) {
  const groups = groupFixedByDueDay(props.items)
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-4">
      {groups.map((group, index) => {
        const isToday = fixedDueInfo(group.dueDay, props.month, props.today).kind === 'today'
        const last = index === groups.length - 1
        return (
          <div key={group.dueDay} className="flex gap-4">
            <div className="flex w-11 flex-none flex-col items-center">
              <DayDot day={group.dueDay} monthAbbr={props.monthAbbr} today={isToday} />
              {last ? null : <div className="w-px flex-1 bg-line" />}
            </div>
            <div className={`flex min-w-0 flex-1 flex-col gap-2 ${last ? 'pb-1' : 'pb-5'}`}>
              {group.items.map((item) => (
                <TimelineRow key={item.id} item={item} {...props} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimelineRow({
  item,
  month,
  today,
  categoryNames,
  mutating,
  onToggle,
  onEdit,
  onDelete,
}: FixedTimelineProps & { item: FixedTimelineItemData }) {
  const paid = item.monthlyStatus === 'pago'
  const badge = fixedDueBadge(
    { type: item.type, dueDay: item.dueDay, monthlyStatus: item.monthlyStatus, paidAt: item.payment?.paidAt ?? null },
    month,
    today,
  )
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
        item.monthlyStatus === 'vencido' ? 'border-negative/45' : 'border-line'
      } ${paid ? 'opacity-60' : ''}`}
    >
      <TypeIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-foreground">{item.name}</div>
        <div className="truncate text-xs text-muted">
          {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'}
        </div>
      </div>
      <div
        className={`text-sm font-black tabular-nums ${
          item.type === 'receita' ? 'text-positive' : 'text-negative'
        }`}
      >
        {item.type === 'receita' ? '+' : ''}
        {money(paid && item.payment ? item.payment.amount : item.amount)}
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
      <Toggle
        checked={paid}
        disabled={mutating}
        aria-label={`Marcar ${item.name} como ${
          paid ? 'pendente' : item.type === 'receita' ? 'recebido' : 'pago'
        }`}
        onCheckedChange={(next) => onToggle(item, next)}
      />
      <span className="inline-flex gap-2">
        <button
          type="button"
          aria-label={`Editar ${item.name}`}
          className="text-muted hover:text-foreground"
          onClick={() => onEdit(item)}
        >
          ✎
        </button>
        <button
          type="button"
          aria-label={`Excluir ${item.name}`}
          className="text-muted hover:text-negative"
          onClick={() => onDelete(item)}
        >
          🗑
        </button>
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Reescrever `gastos-fixos/page.tsx`**

Manter: PageHeader (título/subtítulo atuais), MonthSelector, botão "+ Novo fixo", mutations e `invalidate` como estão, EmptyStates, caixa informativa da virada de mês e `<FixedExpenseForm>`. Substituir os dois blocos de KPIs, o Select e a Tabela:

```tsx
'use client'

import { useMemo, useState } from 'react'
import { fixedPendingSummary } from '@pmf/core'
import { Button, EmptyState, ErrorState, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { MonthSelector } from '@/components/month-selector'
import { FixedExpenseForm, type EditableFixedExpense } from '@/components/fixed-expense-form'
import { FixedKpis } from '@/components/fixed/fixed-kpis'
import { TypeFilterPills, type FixedTypeFilter } from '@/components/fixed/type-filter-pills'
import { FixedTimeline, type FixedTimelineItemData } from '@/components/fixed/fixed-timeline'

export default function FixedExpensesPage() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditableFixedExpense | null>(null)
  const [typeFilter, setTypeFilter] = useState<FixedTypeFilter>('todos')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const utils = trpc.useUtils()
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const categories = trpc.categories.list.useQuery()
  const invalidate = () => {
    utils.fixedExpenses.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const pay = trpc.fixedExpenses.pay.useMutation({ onSuccess: invalidate })
  const unpay = trpc.fixedExpenses.unpay.useMutation({ onSuccess: invalidate })
  const del = trpc.fixedExpenses.delete.useMutation({ onSuccess: invalidate })

  const items = list.data?.items ?? []
  const counts = {
    todos: items.length,
    despesa: items.filter((i) => i.type === 'despesa').length,
    receita: items.filter((i) => i.type === 'receita').length,
  }
  const filteredItems = items.filter((i) => typeFilter === 'todos' || i.type === typeFilter)
  const pending = fixedPendingSummary(items)
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )
  const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()

  return (
    <>
      <PageHeader
        title="Fixos"
        subtitle="Despesas e receitas recorrentes com vencimento e controle mensal. Marcar como pago/recebido registra a transação do mês automaticamente."
      >
        <MonthSelector month={month} onChange={setMonth} />
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          + Novo fixo
        </Button>
      </PageHeader>

      <FixedKpis totals={list.data?.totals} pending={pending} />
      <TypeFilterPills value={typeFilter} onChange={setTypeFilter} counts={counts} />

      {list.isLoading ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum fixo cadastrado"
          hint="Aluguel, condomínio, IPTU, streaming, salário — cadastre e controle mês a mês."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState title="Nenhum item para esse filtro" hint="Troque o filtro acima ou cadastre um novo fixo." />
      ) : (
        <FixedTimeline
          items={filteredItems as FixedTimelineItemData[]}
          month={month}
          today={today}
          monthAbbr={monthAbbr}
          categoryNames={categoryNames}
          mutating={pay.isPending || unpay.isPending}
          onToggle={(item, next) =>
            next ? pay.mutate({ id: item.id, month }) : unpay.mutate({ id: item.id, month })
          }
          onEdit={(item) => {
            setEditing(item as EditableFixedExpense)
            setFormOpen(true)
          }}
          onDelete={(item) => {
            if (
              window.confirm(
                `Excluir "${item.name}"? O histórico de pagamentos deste item será removido; as transações já criadas permanecem.`,
              )
            ) {
              del.mutate({ id: item.id })
            }
          }}
        />
      )}

      <div className="mt-4 rounded-r-lg border-l-4 border-info bg-info/5 px-4 py-3 text-xs text-body">
        <b className="text-foreground">Como funciona a virada do mês:</b> no mês novo tudo volta a
        pendente automaticamente; o histórico fica guardado e você navega para trás no seletor
        acima. Mudou o valor? Vale só do mês vigente em diante — meses pagos guardam o valor da
        época.
      </div>

      <FixedExpenseForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </>
  )
}
```

Nota: os casts `as FixedTimelineItemData[]` / `as EditableFixedExpense` só são necessários se o TS reclamar da inferência do tRPC (campos extras são aceitos estruturalmente); preferir sem cast se compilar. `money` só permanece importado se de fato usado (senão remover para o lint passar).

- [ ] **Step 3: Verificar**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.
Runtime (skill `verify` do projeto): abrir `/gastos-fixos` no browser (tema claro e escuro) e conferir: faixa de 4 KPIs, pills com contagens, agrupamento por dia com bolinha "hoje", item vencido com borda vermelha, pagos esmaecidos, toggle paga/despaga, editar/excluir funcionam, navegação de mês mostra badges absolutas em meses passados.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/fixed/fixed-timeline.tsx apps/web/src/app/\(app\)/gastos-fixos/page.tsx
git commit -m "feat(fixos): agenda de vencimentos na tela Fixos da web"
```

---

### Task 4: Web — widget combinado "Fixos do mês" na Início

**Files:**
- Create: `apps/web/src/components/fixed/fixed-month-widget.tsx`
- Modify: `apps/web/src/app/(app)/page.tsx` (substituir o Card "Fixos do mês" das linhas 121–158 por `<FixedMonthWidget month={month} />` e remover a query `fixed` e os derivados `fixedItems`/`fixedExpenseItems`/`fixedIncomeItems`/`paidExpenseCount`/`paidIncomeCount`/`nextPending` que ficarem sem uso; remover imports órfãos, ex.: `Badge`)

**Interfaces:**
- Consumes: Task 1 (`fixedBalance`, `fixedDueBadge`, `fixedDueInfo`, `nextPendingFixed`), Task 2 (`DayDot`, `TypeIcon`); `Card`, `Badge`, `EmptyState`, `LoadingState` de `@pmf/ui-web`.
- Produces: `FixedMonthWidget({ month }: { month: string })`.

- [ ] **Step 1: Criar `fixed-month-widget.tsx`**

```tsx
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { fixedBalance, fixedDueBadge, fixedDueInfo, nextPendingFixed } from '@pmf/core'
import { Badge, Card, EmptyState, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money, monthLabel } from '@/lib/format'
import { DayDot, TypeIcon } from './timeline-bits'

/** Widget da Início: mini agenda das próximas pendências + progresso do mês. */
export function FixedMonthWidget({ month }: { month: string }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const categories = trpc.categories.list.useQuery()

  const items = list.data?.items ?? []
  const totals = list.data?.totals
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )

  if (list.isLoading) {
    return (
      <Card>
        <LoadingState />
      </Card>
    )
  }

  const balance = totals ? fixedBalance(totals) : 0
  const upcoming = nextPendingFixed(items, 3)
  const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[2.5px] text-muted">
          Fixos do mês
        </span>
        {items.length > 0 ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${
              balance < 0 ? 'bg-negative/10 text-negative' : 'bg-positive/10 text-positive'
            }`}
          >
            {balance < 0 ? '−' : '+'}
            {money(Math.abs(balance))}
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum fixo cadastrado"
          hint="Cadastre aluguel, contas, assinaturas e salário."
        />
      ) : (
        <>
          {upcoming.length === 0 ? (
            <div className="py-1 text-lg font-black text-positive">✓ Tudo em dia</div>
          ) : (
            upcoming.map((item) => {
              const badge = fixedDueBadge(
                { type: item.type, dueDay: item.dueDay, monthlyStatus: item.monthlyStatus, paidAt: null },
                month,
                today,
              )
              const isToday = fixedDueInfo(item.dueDay, month, today).kind === 'today'
              return (
                <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                  <DayDot day={item.dueDay} monthAbbr={monthAbbr} today={isToday} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">{item.name}</div>
                    <div className="truncate text-xs text-muted">
                      {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-black tabular-nums ${
                      item.type === 'receita' ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {item.type === 'receita' ? '+' : ''}
                    {money(item.amount)}
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
              )
            })
          )}

          <div className="my-2 border-t border-line" />
          <ProgressRow kind="despesa" items={items} totals={totals} />
          <ProgressRow kind="receita" items={items} totals={totals} />

          <div className="mt-1 text-right">
            <Link href="/gastos-fixos" className="text-xs font-bold text-info hover:underline">
              Ver todos →
            </Link>
          </div>
        </>
      )}
    </Card>
  )
}

function ProgressRow({
  kind,
  items,
  totals,
}: {
  kind: 'despesa' | 'receita'
  items: Array<{ type: string; monthlyStatus: string; amount: string }>
  totals: NonNullable<ReturnType<typeof useFixedTotals>>
}) {
  const t = kind === 'despesa' ? totals.expense : totals.income
  const ofType = items.filter((i) => i.type === kind)
  const paidCount = ofType.filter((i) => i.monthlyStatus === 'pago').length
  const lateAmount = ofType
    .filter((i) => i.monthlyStatus === 'vencido')
    .reduce((acc, i) => acc + Number(i.amount), 0)
  const paidPct = t.total ? Math.round((t.paid / t.total) * 100) : 0
  const latePct = t.total ? Math.round((lateAmount / t.total) * 100) : 0
  const noun = kind === 'despesa' ? 'pagas' : 'recebidas'
  const pendingLabel = kind === 'despesa' ? 'pend.' : 'a receber'
  return (
    <div className="mb-2">
      <div className="flex items-baseline gap-1.5 text-xs">
        <span className="font-black text-foreground">
          {kind === 'despesa' ? 'Despesas' : 'Receitas'}
        </span>
        <span className="text-muted">
          {paidCount} de {ofType.length} {noun}
        </span>
        <span className="ml-auto tabular-nums text-muted">
          {money(t.pending)} {pendingLabel}
        </span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-positive" style={{ width: `${paidPct}%` }} />
        {latePct > 0 ? <div className="h-full bg-negative" style={{ width: `${latePct}%` }} /> : null}
      </div>
    </div>
  )
}
```

Nota de tipo: em vez do pseudo-`useFixedTotals` acima, tipar `totals` do `ProgressRow` como `{ expense: FixedExpenseTotals; income: FixedExpenseTotals }` importando `FixedExpenseTotals` de `@pmf/core` (o chamador garante não-undefined: renderizar `ProgressRow` somente quando `totals` existir, ex. `{totals ? <>...</> : null}`).

- [ ] **Step 2: Integrar na Início**

Em `apps/web/src/app/(app)/page.tsx`: importar `FixedMonthWidget` de `@/components/fixed/fixed-month-widget`; no lugar do `<Card><CardTitle>Fixos do mês</CardTitle>…</Card>` (bloco atual das linhas 121–158) renderizar `<FixedMonthWidget month={month} />`; apagar a query `const fixed = trpc.fixedExpenses.list.useQuery({ month })` e os derivados que ficarem órfãos; limpar imports sem uso (`Badge`, possivelmente `formatDate`… conferir com o lint).

- [ ] **Step 3: Verificar**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.
Runtime: Início no browser — chip de saldo, até 3 pendências com bolinha do dia, barras de progresso corretas, "Tudo em dia ✓" quando não há pendências (testar marcando tudo como pago), link leva a `/gastos-fixos`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/fixed/fixed-month-widget.tsx apps/web/src/app/\(app\)/page.tsx
git commit -m "feat(fixos): widget combinado de fixos na Início da web"
```

---

### Task 5: Mobile — KPIs 2×2, pills e agenda na tela Fixos

**Files:**
- Create: `apps/mobile/src/components/fixed-timeline-bits.tsx`
- Create: `apps/mobile/src/components/fixed-kpis.tsx`
- Create: `apps/mobile/src/components/fixed-timeline.tsx`
- Modify: `apps/mobile/app/(tabs)/fixos.tsx` (substituir seções de KPIs, FilterChips e lista; manter month bar, form inline, rodapé)

**Interfaces:**
- Consumes: Task 1 (mesmas funções, via `@pmf/core`); `Badge`, `Card`, `Toggle` de `@/components/ui`; `money`, `monthLabel` de `@/lib/format`; Ionicons.
- Produces:
  - `TypeIcon({ type })` e `DayDot({ day, monthAbbr, today })` (versões RN)
  - `FixedKpis({ totals, pending })` (grade 2×2)
  - `FixedTimeline({ items, month, today, monthAbbr, categoryNames, mutating, onToggle, onEdit, onDelete })` com o mesmo shape `FixedTimelineItemData` da Task 3

- [ ] **Step 1: Criar `fixed-timeline-bits.tsx`**

```tsx
import { Text, View, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

/** Peças da agenda de fixos (tela Fixos + widget da Início) — versão RN. */

export function TypeIcon({ type }: { type: 'despesa' | 'receita' }) {
  const dark = useColorScheme() === 'dark'
  const income = type === 'receita'
  const color = income ? (dark ? '#5CBF8B' : '#2D6E44') : dark ? '#F0707A' : '#BA1925'
  return (
    <View
      className={`h-8 w-8 items-center justify-center rounded-full ${
        income ? 'bg-positive/10' : 'bg-negative/10'
      }`}
    >
      <Ionicons name={income ? 'trending-up' : 'trending-down'} size={14} color={color} />
    </View>
  )
}

export function DayDot({
  day,
  monthAbbr,
  today = false,
}: {
  day: number
  monthAbbr: string
  today?: boolean
}) {
  return (
    <View
      className={`h-10 w-10 items-center justify-center rounded-full border ${
        today
          ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
          : 'border-line bg-background dark:border-line-dark dark:bg-background-dark'
      }`}
    >
      <Text
        className={`text-xs font-black leading-none ${
          today
            ? 'text-background dark:text-background-dark'
            : 'text-foreground dark:text-foreground-dark'
        }`}
      >
        {String(day).padStart(2, '0')}
      </Text>
      <Text
        className={`text-[7px] font-bold uppercase leading-none ${
          today ? 'text-background/70 dark:text-background-dark/70' : 'text-muted dark:text-muted-dark'
        }`}
      >
        {today ? 'hoje' : monthAbbr}
      </Text>
    </View>
  )
}
```

- [ ] **Step 2: Criar `fixed-kpis.tsx` (grade 2×2)**

```tsx
import { Text, View } from 'react-native'
import { fixedBalance, type FixedExpenseTotals } from '@pmf/core'
import { money } from '@/lib/format'
import { Card } from '@/components/ui'

interface FixedKpisProps {
  totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals } | undefined
  pending: { count: number; amount: number }
}

function Cell({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <Card className="flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
        {label}
      </Text>
      <Text className={`mt-1 text-base font-black tabular-nums ${cls}`} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  )
}

/** Grade 2×2 com os 4 KPIs da tela Fixos. */
export function FixedKpis({ totals, pending }: FixedKpisProps) {
  const balance = totals ? fixedBalance(totals) : 0
  const neutral = 'text-foreground dark:text-foreground-dark'
  const pos = 'text-positive dark:text-positive-dark'
  const neg = 'text-negative dark:text-negative-dark'
  return (
    <View className="mb-4 gap-2">
      <View className="flex-row gap-2">
        <Cell label="Despesas fixas" value={money(totals?.expense.total ?? 0)} cls={neutral} />
        <Cell label="Receitas fixas" value={money(totals?.income.total ?? 0)} cls={neutral} />
      </View>
      <View className="flex-row gap-2">
        <Cell
          label="Saldo fixo do mês"
          value={`${balance < 0 ? '−' : '+'}${money(Math.abs(balance))}`}
          cls={balance < 0 ? neg : pos}
        />
        <Cell
          label="Pendências"
          value={
            pending.count === 0
              ? 'Tudo em dia ✓'
              : `${pending.count} ${pending.count === 1 ? 'item' : 'itens'} · ${money(pending.amount)}`
          }
          cls={pending.count === 0 ? pos : neg}
        />
      </View>
    </View>
  )
}
```

- [ ] **Step 3: Criar `fixed-timeline.tsx` (RN)**

```tsx
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { fixedDueBadge, fixedDueInfo, groupFixedByDueDay } from '@pmf/core'
import { money } from '@/lib/format'
import { Badge, Toggle } from '@/components/ui'
import { DayDot, TypeIcon } from './fixed-timeline-bits'

export interface FixedTimelineItemData {
  id: string
  name: string
  type: 'despesa' | 'receita'
  amount: string
  dueDay: number
  categoryId: string | null
  monthlyStatus: 'pago' | 'pendente' | 'vencido'
  payment: { amount: string; paidAt: string } | null
}

interface FixedTimelineProps {
  items: FixedTimelineItemData[]
  month: string
  today: string
  monthAbbr: string
  categoryNames: Map<string, string>
  mutating: boolean
  onToggle: (item: FixedTimelineItemData, next: boolean) => void
  onEdit: (item: FixedTimelineItemData) => void
  onDelete: (item: FixedTimelineItemData) => void
}

/** Linha do tempo por dia de vencimento — versão RN. */
export function FixedTimeline(props: FixedTimelineProps) {
  const groups = groupFixedByDueDay(props.items)
  return (
    <View>
      {groups.map((group, index) => {
        const isToday = fixedDueInfo(group.dueDay, props.month, props.today).kind === 'today'
        const last = index === groups.length - 1
        return (
          <View key={group.dueDay} className="flex-row gap-3">
            <View className="w-10 items-center">
              <DayDot day={group.dueDay} monthAbbr={props.monthAbbr} today={isToday} />
              {last ? null : <View className="w-px flex-1 bg-line dark:bg-line-dark" />}
            </View>
            <View className={`min-w-0 flex-1 gap-2 ${last ? 'pb-1' : 'pb-4'}`}>
              {group.items.map((item) => (
                <TimelineRow key={item.id} item={item} {...props} />
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function TimelineRow({
  item,
  month,
  today,
  categoryNames,
  mutating,
  onToggle,
  onEdit,
  onDelete,
}: FixedTimelineProps & { item: FixedTimelineItemData }) {
  const paid = item.monthlyStatus === 'pago'
  const badge = fixedDueBadge(
    { type: item.type, dueDay: item.dueDay, monthlyStatus: item.monthlyStatus, paidAt: item.payment?.paidAt ?? null },
    month,
    today,
  )
  return (
    <View
      className={`flex-row items-center gap-2.5 rounded-xl border bg-surface px-3 py-2.5 dark:bg-surface-dark ${
        item.monthlyStatus === 'vencido'
          ? 'border-negative/45 dark:border-negative-dark/45'
          : 'border-line dark:border-line-dark'
      } ${paid ? 'opacity-60' : ''}`}
    >
      <TypeIcon type={item.type} />
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-bold text-foreground dark:text-foreground-dark"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-1.5">
          <Text className="text-[11px] text-muted dark:text-muted-dark" numberOfLines={1}>
            {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'} ·{' '}
            <Text
              className={`font-black tabular-nums ${
                item.type === 'receita'
                  ? 'text-positive dark:text-positive-dark'
                  : 'text-negative dark:text-negative-dark'
              }`}
            >
              {item.type === 'receita' ? '+' : ''}
              {money(paid && item.payment ? item.payment.amount : item.amount)}
            </Text>
          </Text>
          <Badge tone={badge.tone} label={badge.label} />
        </View>
      </View>
      <Pressable accessibilityLabel={`Editar ${item.name}`} hitSlop={8} onPress={() => onEdit(item)}>
        <Ionicons name="create-outline" size={18} color="#9C9B9B" />
      </Pressable>
      <Pressable
        accessibilityLabel={`Excluir ${item.name}`}
        hitSlop={8}
        onPress={() => onDelete(item)}
      >
        <Ionicons name="trash-outline" size={18} color="#9C9B9B" />
      </Pressable>
      <Toggle checked={paid} disabled={mutating} onChange={(next) => onToggle(item, next)} />
    </View>
  )
}
```

- [ ] **Step 4: Reescrever a tela `fixos.tsx`**

Manter: month bar, form inline (`FixedExpenseFormCard`), rodapé explicativo, EmptyStates, mutations. Substituir: as duas seções de KPIs por `<FixedKpis totals={list.data?.totals} pending={fixedPendingSummary(items)} />`; os `FilterChip`s por pills segmentadas com contagem (mesma linguagem da web — container `flex-row self-start rounded-full border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark`, chip ativo `rounded-full bg-foreground px-3.5 py-1.5 dark:bg-foreground-dark` com texto `text-background dark:text-background-dark`, inativo sem borda com `text-body dark:text-body-dark`); a lista em `<Card>` por `<FixedTimeline …/>` com os mesmos handlers de hoje (`pay`/`unpay`/`del` + `confirmDelete`). Adicionar `const today = new Date().toISOString().slice(0, 10)` (via `useMemo`), `const categories = trpc.categories.list.useQuery()` e o `Map` de nomes, e `const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()`. O `FilterChip` local morre; contagens: `{ todos, despesa, receita }` como na web. Se o arquivo passar de 300 linhas, extrair as pills para `apps/mobile/src/components/type-filter-pills.tsx`.

- [ ] **Step 5: Verificar**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.
Runtime (skill `verify`): bundle do Metro compila; conferir a tela Fixos no app (KPIs 2×2, pills, agenda com trilho, toggle/editar/excluir).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/fixed-timeline-bits.tsx apps/mobile/src/components/fixed-kpis.tsx apps/mobile/src/components/fixed-timeline.tsx apps/mobile/app/\(tabs\)/fixos.tsx
git commit -m "feat(fixos): agenda de vencimentos e KPIs 2x2 na tela Fixos do mobile"
```

---

### Task 6: Mobile — widget combinado "Fixos do mês" na Início

**Files:**
- Create: `apps/mobile/src/components/fixed-month-widget.tsx`
- Modify: `apps/mobile/app/(tabs)/inicio.tsx` (substituir o Card "Fixos do mês" das linhas 61–92 por `<FixedMonthWidget month={month} />`; remover a query `fixed` e os derivados `fixedItems`/`fixedExpenseItems`/`fixedIncomeItems`/`paidExpenseCount`/`paidIncomeCount`; limpar imports órfãos)

**Interfaces:**
- Consumes: Task 1 (`fixedBalance`, `fixedDueBadge`, `fixedDueInfo`, `nextPendingFixed`), Task 5 (`DayDot`, `TypeIcon` de `./fixed-timeline-bits`); `Badge`, `Card`, `EmptyState` de `@/components/ui`; `Link` de `expo-router`.
- Produces: `FixedMonthWidget({ month }: { month: string })` (RN).

- [ ] **Step 1: Criar `fixed-month-widget.tsx`** — espelho do widget web (Task 4) em RN: mesmo layout (título + chip de saldo com `bg-positive/10`/`bg-negative/10`; mini agenda `nextPendingFixed(items, 3)` com `DayDot`/nome/categoria/valor/badge; divisor `border-t border-line dark:border-line-dark`; duas barras de progresso com `View` de altura `h-1.5` — trilho `bg-line dark:bg-line-dark`, preenchimento `bg-positive dark:bg-positive-dark` com `style={{ width: \`${paidPct}%\` }}` e segmento vencido `bg-negative dark:bg-negative-dark`; `Link href="/(tabs)/fixos"` "Ver todos →" com `text-info dark:text-info-dark`). Estados: `items.length === 0` → EmptyState atual da Início; sem pendências → `✓ Tudo em dia` em `text-positive dark:text-positive-dark`. A lógica de `ProgressRow` (contagens, `paidPct`, `latePct`) é idêntica à da Task 4.

- [ ] **Step 2: Integrar na `inicio.tsx`** conforme "Files" acima (o widget faz a própria query; a Início deixa de consultar `fixedExpenses.list`).

- [ ] **Step 3: Verificar**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.
Runtime: Início do app mostra o widget combinado; link navega para a aba Fixos.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/fixed-month-widget.tsx apps/mobile/app/\(tabs\)/inicio.tsx
git commit -m "feat(fixos): widget combinado de fixos na Início do mobile"
```

---

### Task 7: Gates finais e verificação de runtime

**Files:** nenhum novo (correções pontuais se os gates acusarem).

- [ ] **Step 1: Gates completos**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: todos PASS. Corrigir o que falhar e re-rodar.

- [ ] **Step 2: Verificação runtime ponta a ponta** (skill `verify` do projeto)

Web (browser, claro + escuro): `/gastos-fixos` — 4 KPIs, pills, agenda, toggle pagar/despagar reflete na Início; mês anterior mostra badges absolutas. Início — widget combinado com chip, mini agenda e barras. Mobile (bundle Metro): tela Fixos e Início equivalentes.

- [ ] **Step 3: Commit final (se houve correções)**

```bash
git add -A && git commit -m "fix(fixos): ajustes dos gates do redesign"
```
