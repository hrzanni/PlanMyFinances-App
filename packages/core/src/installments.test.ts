import { describe, it, expect } from 'vitest'
import { installmentTotals, isValidAmountPaid } from './installments'

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
  it('sem erro de ponto flutuante com centavos', () => {
    expect(installmentTotals(487.5, 4, 975)).toEqual({ total: 1950, remaining: 975 })
  })
})

describe('isValidAmountPaid', () => {
  it('aceita dentro do intervalo', () => {
    expect(isValidAmountPaid(100, 3, 300)).toBe(true)
    expect(isValidAmountPaid(100, 3, 0)).toBe(true)
  })
  it('rejeita acima do total (RN-004 / FR-024)', () => {
    expect(isValidAmountPaid(100, 3, 300.01)).toBe(false)
  })
  it('rejeita negativo', () => {
    expect(isValidAmountPaid(100, 3, -1)).toBe(false)
  })
})
