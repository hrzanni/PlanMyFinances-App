import { describe, it, expect } from 'vitest'
import { formatCurrency, toNumber, sumAmounts } from './money'

describe('formatCurrency', () => {
  it('formata em BRL pt-BR', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50')
  })
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
  it('formata negativo', () => {
    expect(formatCurrency(-10)).toBe('-R$ 10,00')
  })
})

describe('toNumber', () => {
  it('converte numeric string', () => {
    expect(toNumber('1850.00')).toBe(1850)
  })
  it('null e vazio viram 0', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber('')).toBe(0)
    expect(toNumber(undefined)).toBe(0)
  })
})

describe('sumAmounts', () => {
  it('soma strings numeric sem erro de ponto flutuante', () => {
    expect(sumAmounts(['0.10', '0.20'])).toBe(0.3)
    expect(sumAmounts(['1850.00', '480.00', '553.02'])).toBe(2883.02)
  })
  it('lista vazia soma 0', () => {
    expect(sumAmounts([])).toBe(0)
  })
})
