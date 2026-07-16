import { describe, it, expect } from 'vitest'
import { isFixedExpenseActiveInMonth, resolveAmountForMonth } from './fixed-expense-amount'

describe('isFixedExpenseActiveInMonth', () => {
  it('mês antes da criação não está ativo', () => {
    expect(isFixedExpenseActiveInMonth('2026-07-01', null, '2026-06-01')).toBe(false)
  })
  it('mês exatamente no início está ativo', () => {
    expect(isFixedExpenseActiveInMonth('2026-07-01', null, '2026-07-01')).toBe(true)
  })
  it('mês depois do início, sem encerramento, está ativo', () => {
    expect(isFixedExpenseActiveInMonth('2026-07-01', null, '2027-01-01')).toBe(true)
  })
  it('mês igual ao último mês ativo (effective_until) ainda está ativo', () => {
    expect(isFixedExpenseActiveInMonth('2026-01-01', '2026-06-01', '2026-06-01')).toBe(true)
  })
  it('mês depois do effective_until não está mais ativo', () => {
    expect(isFixedExpenseActiveInMonth('2026-01-01', '2026-06-01', '2026-07-01')).toBe(false)
  })
})

describe('resolveAmountForMonth', () => {
  const history = [
    { amount: '1000.00', effectiveFrom: '2025-01-01' },
    { amount: '1200.00', effectiveFrom: '2026-09-01' },
  ]

  it('mês antes de qualquer entrada de histórico não resolve valor', () => {
    expect(resolveAmountForMonth(history, '2024-12-01')).toBeNull()
  })
  it('mês igual à primeira entrada usa o valor dela', () => {
    expect(resolveAmountForMonth(history, '2025-01-01')).toBe('1000.00')
  })
  it('mês entre dois reajustes usa o valor mais recente até então', () => {
    expect(resolveAmountForMonth(history, '2026-08-01')).toBe('1000.00')
  })
  it('mês do reajuste em diante usa o novo valor', () => {
    expect(resolveAmountForMonth(history, '2026-09-01')).toBe('1200.00')
    expect(resolveAmountForMonth(history, '2027-01-01')).toBe('1200.00')
  })
  it('histórico fora de ordem ainda resolve corretamente', () => {
    const shuffled = [history[1]!, history[0]!]
    expect(resolveAmountForMonth(shuffled, '2026-08-01')).toBe('1000.00')
  })
  it('sem nenhuma entrada não resolve valor', () => {
    expect(resolveAmountForMonth([], '2026-08-01')).toBeNull()
  })
})
