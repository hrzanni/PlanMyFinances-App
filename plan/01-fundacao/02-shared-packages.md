# Tarefas 1.2–1.4 — Pacotes compartilhados (types, schemas, core)

**Files:**
- Create: `packages/types/package.json`, `packages/types/src/index.ts`, `packages/types/tsconfig.json`
- Create: `packages/schemas/package.json`, `packages/schemas/src/index.ts`, `packages/schemas/tsconfig.json`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`
- Create: `packages/core/src/{money.ts,date.ts,balance.ts,installments.ts,fixed-expenses.ts,folders.ts,index.ts}`
- Test: `packages/core/src/{money.test.ts,date.test.ts,balance.test.ts,installments.test.ts,fixed-expenses.test.ts,folders.test.ts}`

**Interfaces:**
- Consumes: nada.
- Produces: ver bloco de interfaces no `README.md` da fase (`packages/types`, `packages/core`, `packages/schemas`).

---

## 1.2 — packages/types

- [ ] **Passo 1: `packages/types/package.json`**

```json
{
  "name": "@pmf/types",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit", "build": "tsc", "test": "echo no-tests" }
}
```

- [ ] **Passo 2: `packages/types/src/index.ts`**

```ts
export type TransactionType = 'receita' | 'despesa'
export type TransactionSource = 'manual' | 'fixed_expense' | 'pluggy'
export type ChargeStatus = 'pendente' | 'cobrado' | 'pago'
export type InvoiceStatus = 'pendente' | 'pago'
export type FixedExpenseStatus = 'active' | 'archived'
export type FolderStatus = 'active' | 'archived'
export type BankConnectionStatus = 'connected' | 'error' | 'expired'
export type MonthlyExpenseStatus = 'pago' | 'pendente' | 'vencido'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  value: string
  description: string | null
  categoryId: string | null
  subcategoryId: string | null
  folderId: string | null
  source: TransactionSource
  externalId: string | null
  date: string
  createdAt: string
}
```

- [ ] **Passo 3: `packages/types/tsconfig.json`**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist", "rootDir": "src" }, "include": ["src"] }
```

- [ ] **Passo 4: Commit**

```bash
git add packages/types && git commit -m "feat(types): tipos de domínio compartilhados"
```

---

## 1.4 — packages/core (TDD)

> Faço o core antes do schemas porque o schemas reusa a constante de tipos; core é puro e ancora os testes.

- [ ] **Passo 1: `packages/core/package.json`**

```json
{
  "name": "@pmf/core",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit", "build": "tsc", "test": "vitest run" },
  "dependencies": { "@pmf/types": "workspace:*" },
  "devDependencies": { "vitest": "^2.1.0" }
}
```

- [ ] **Passo 2: `packages/core/vitest.config.ts` e `tsconfig.json`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { coverage: { reporter: ['text', 'lcov'] } } })
```
```json
// tsconfig.json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist", "rootDir": "src" }, "include": ["src"] }
```

### money.ts — formatCurrency (RN: BRL pt-BR)

- [ ] **Passo 3: Escrever o teste que falha** — `packages/core/src/money.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './money'

describe('formatCurrency', () => {
  it('formata em BRL pt-BR', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50')
  })
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})
```

- [ ] **Passo 4: Rodar e ver falhar**

Run: `pnpm --filter @pmf/core test`
Expected: FAIL ("formatCurrency is not defined").

- [ ] **Passo 5: Implementar `packages/core/src/money.ts`**

```ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
```

- [ ] **Passo 6: Rodar e ver passar**

Run: `pnpm --filter @pmf/core test`
Expected: PASS. (Se o runtime usar espaço comum em vez de NBSP, ajustar o esperado para o caractere que o ICU emitir; o ponto é o formato pt-BR/BRL.)

### date.ts — monthRange, dueThisMonth, formatDate

- [ ] **Passo 7: Teste que falha** — `packages/core/src/date.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { monthRange, dueThisMonth, formatDate } from './date'

describe('monthRange', () => {
  it('retorna primeiro e último dia do mês de referência', () => {
    expect(monthRange(new Date('2026-06-15T12:00:00Z'))).toEqual({ from: '2026-06-01', to: '2026-06-30' })
  })
})
describe('dueThisMonth', () => {
  const ref = new Date('2026-06-15T12:00:00Z')
  it('true quando due_date está no mês/ano de ref', () => {
    expect(dueThisMonth('2026-06-30', ref)).toBe(true)
  })
  it('false quando em outro mês', () => {
    expect(dueThisMonth('2026-07-01', ref)).toBe(false)
  })
  it('false quando null', () => {
    expect(dueThisMonth(null, ref)).toBe(false)
  })
})
describe('formatDate', () => {
  it('formata ISO para DD/MM/YYYY', () => {
    expect(formatDate('2026-06-05')).toBe('05/06/2026')
  })
})
```

- [ ] **Passo 8: Rodar e ver falhar**

Run: `pnpm --filter @pmf/core test`
Expected: FAIL.

- [ ] **Passo 9: Implementar `packages/core/src/date.ts`**

```ts
function pad(n: number): string { return String(n).padStart(2, '0') }

export function monthRange(ref: Date): { from: string; to: string } {
  const y = ref.getUTCFullYear()
  const m = ref.getUTCMonth()
  const first = new Date(Date.UTC(y, m, 1))
  const last = new Date(Date.UTC(y, m + 1, 0))
  const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  return { from: iso(first), to: iso(last) }
}

export function dueThisMonth(dueDate: string | null, ref: Date): boolean {
  if (!dueDate) return false
  const [y, m] = dueDate.split('-').map(Number)
  return y === ref.getUTCFullYear() && m === ref.getUTCMonth() + 1
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
```

- [ ] **Passo 10: Rodar e ver passar** — `pnpm --filter @pmf/core test` → PASS.

### balance.ts — monthlyBalance (RN-001)

- [ ] **Passo 11: Teste que falha** — `packages/core/src/balance.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { monthlyBalance } from './balance'

describe('monthlyBalance', () => {
  it('soma receitas e despesas e calcula saldo', () => {
    const r = monthlyBalance([
      { type: 'receita', value: '100.00' },
      { type: 'receita', value: '50.50' },
      { type: 'despesa', value: '30.00' },
    ])
    expect(r).toEqual({ income: 150.5, expense: 30, balance: 120.5 })
  })
  it('lista vazia zera tudo', () => {
    expect(monthlyBalance([])).toEqual({ income: 0, expense: 0, balance: 0 })
  })
})
```

- [ ] **Passo 12: Rodar e ver falhar** → FAIL.

- [ ] **Passo 13: Implementar `packages/core/src/balance.ts`**

```ts
import type { Transaction } from '@pmf/types'

export function monthlyBalance(txs: Pick<Transaction, 'type' | 'value'>[]): {
  income: number; expense: number; balance: number
} {
  let income = 0, expense = 0
  for (const t of txs) {
    const v = Number(t.value)
    if (t.type === 'receita') income += v
    else expense += v
  }
  return { income, expense, balance: income - expense }
}
```

- [ ] **Passo 14: Rodar e ver passar** → PASS.

### installments.ts — installmentTotals (RN-003/004)

- [ ] **Passo 15: Teste que falha** — `packages/core/src/installments.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { installmentTotals } from './installments'

describe('installmentTotals', () => {
  it('calcula total e restante', () => {
    expect(installmentTotals(100, 3, 50)).toEqual({ total: 300, remaining: 250 })
  })
  it('parcela única', () => {
    expect(installmentTotals(100, 1, 0)).toEqual({ total: 100, remaining: 100 })
  })
  it('totalmente pago zera o restante', () => {
    expect(installmentTotals(100, 2, 200)).toEqual({ total: 200, remaining: 0 })
  })
})
```

- [ ] **Passo 16: Rodar e ver falhar** → FAIL.

- [ ] **Passo 17: Implementar `packages/core/src/installments.ts`**

```ts
export function installmentTotals(
  amountPerInstallment: number,
  totalInstallments: number,
  amountPaid: number,
): { total: number; remaining: number } {
  const total = amountPerInstallment * totalInstallments
  return { total, remaining: total - amountPaid }
}
```

- [ ] **Passo 18: Rodar e ver passar** → PASS.

### fixed-expenses.ts — status mensal, totais e vencimento efetivo (RN-100/101/102, spec amendment 2026-07-06)

- [ ] **Passo 18a: Testes que falham** — `packages/core/src/fixed-expenses.test.ts`. Casos mínimos:
  - `referenceMonth('2026-07-15')` → `'2026-07-01'`.
  - `effectiveDueDate(31, '2026-02-01')` → `'2026-02-28'` (mês curto usa último dia); `effectiveDueDate(5, '2026-07-01')` → `'2026-07-05'`.
  - `fixedExpenseStatus`: com `paidAt` → `'pago'`; sem `paidAt` e vencimento futuro no mês → `'pendente'`; sem `paidAt` e vencimento passado (mês corrente ou anterior) → `'vencido'`; mês futuro nunca é `'vencido'`.
  - `fixedExpenseTotals`: total soma `amount` vigente dos ativos; pago soma snapshot dos payments do mês; pendente = soma dos `amount` vigentes dos NÃO pagos (não é total−pago, por causa do snapshot).
- [ ] **Passo 18b: Implementar `packages/core/src/fixed-expenses.ts`** e ver os testes passarem.

### folders.ts — total por pasta (RN-110)

- [ ] **Passo 18c: Teste que falha** — `folderTotal` soma só `despesa` com `folderId` igual; ignora outras pastas e receitas; pasta sem transações → 0.
- [ ] **Passo 18d: Implementar `packages/core/src/folders.ts`** e ver passar.

- [ ] **Passo 19: Barrel `packages/core/src/index.ts`**

```ts
export * from './money'
export * from './date'
export * from './balance'
export * from './installments'
export * from './fixed-expenses'
export * from './folders'
```

- [ ] **Passo 20: Rodar a suíte inteira e commitar**

Run: `pnpm --filter @pmf/core test`
Expected: todos PASS.

```bash
git add packages/core && git commit -m "feat(core): cálculos puros de domínio com testes (saldo, parcelas, datas, moeda)"
```

---

## 1.3 — packages/schemas (Zod)

- [ ] **Passo 1: `packages/schemas/package.json`**

```json
{
  "name": "@pmf/schemas",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit", "build": "tsc", "test": "echo no-tests" },
  "dependencies": { "zod": "^3.23.0" }
}
```

- [ ] **Passo 2: `packages/schemas/src/index.ts`**

```ts
import { z } from 'zod'

export const transactionType = z.enum(['receita', 'despesa'])

export const createTransactionInput = z.object({
  type: transactionType,
  value: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
})
export type CreateTransactionInput = z.infer<typeof createTransactionInput>

export const updateTransactionInput = createTransactionInput.partial().extend({
  id: z.string().uuid(),
})
export type UpdateTransactionInput = z.infer<typeof updateTransactionInput>

export const listTransactionsInput = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: transactionType.optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
})
```

- [ ] **Passo 3: `packages/schemas/tsconfig.json`** (igual aos demais, `extends` base).

- [ ] **Passo 4: Commit**

```bash
git add packages/schemas && git commit -m "feat(schemas): validação Zod de transações"
```
