import { describe, it, expect } from 'vitest'
import { fixedExpenseStatus, fixedExpenseTotals } from './fixed-expenses'

describe('fixedExpenseStatus (RN-100)', () => {
  const month = '2026-07-01'
  it('pago quando existe pagamento no mês', () => {
    expect(fixedExpenseStatus({ dueDay: 5, month, today: '2026-07-15', paidAt: '2026-07-05' })).toBe(
      'pago',
    )
  })
  it('pendente quando vencimento ainda não chegou', () => {
    expect(fixedExpenseStatus({ dueDay: 20, month, today: '2026-07-15', paidAt: null })).toBe(
      'pendente',
    )
  })
  it('pendente no próprio dia do vencimento', () => {
    expect(fixedExpenseStatus({ dueDay: 15, month, today: '2026-07-15', paidAt: null })).toBe(
      'pendente',
    )
  })
  it('vencido quando o vencimento passou sem pagamento', () => {
    expect(fixedExpenseStatus({ dueDay: 5, month, today: '2026-07-15', paidAt: null })).toBe(
      'vencido',
    )
  })
  it('mês passado sem pagamento é vencido', () => {
    expect(
      fixedExpenseStatus({ dueDay: 20, month: '2026-06-01', today: '2026-07-15', paidAt: null }),
    ).toBe('vencido')
  })
  it('mês futuro nunca é vencido', () => {
    expect(
      fixedExpenseStatus({ dueDay: 5, month: '2026-08-01', today: '2026-07-15', paidAt: null }),
    ).toBe('pendente')
  })
  it('due_day 31 em mês curto usa o último dia (edge case)', () => {
    expect(
      fixedExpenseStatus({ dueDay: 31, month: '2026-06-01', today: '2026-06-30', paidAt: null }),
    ).toBe('pendente')
  })
})

describe('fixedExpenseTotals (RN-101)', () => {
  it('calcula total, pago e pendente do mês', () => {
    const r = fixedExpenseTotals([
      { amount: '1850.00', paidAmount: '1850.00' },
      { amount: '480.00', paidAmount: '480.00' },
      { amount: '210.00', paidAmount: null },
      { amount: '119.90', paidAmount: null },
      { amount: '145.32', paidAmount: null },
      { amount: '21.90', paidAmount: null },
      { amount: '55.90', paidAmount: null },
    ])
    expect(r).toEqual({ total: 2883.02, paid: 2330, pending: 553.02 })
  })
  it('pago usa o snapshot, não o valor vigente (FR-105)', () => {
    // aluguel subiu para 1980 depois do pagamento de julho a 1850
    const r = fixedExpenseTotals([{ amount: '1980.00', paidAmount: '1850.00' }])
    expect(r).toEqual({ total: 1850, paid: 1850, pending: 0 })
  })
  it('mês sem gastos zera tudo', () => {
    expect(fixedExpenseTotals([])).toEqual({ total: 0, paid: 0, pending: 0 })
  })
})
