import { describe, it, expect } from 'vitest'
import { monthlyBalance, accumulatedBalanceByDay } from './balance'

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

describe('accumulatedBalanceByDay', () => {
  it('acumula saldo dia a dia em ordem', () => {
    const points = accumulatedBalanceByDay([
      { type: 'despesa', value: '50.00', date: '2026-07-03' },
      { type: 'receita', value: '100.00', date: '2026-07-01' },
      { type: 'despesa', value: '20.00', date: '2026-07-01' },
    ])
    expect(points).toEqual([
      { date: '2026-07-01', balance: 80 },
      { date: '2026-07-03', balance: 30 },
    ])
  })
  it('sem transações retorna vazio', () => {
    expect(accumulatedBalanceByDay([])).toEqual([])
  })
})
