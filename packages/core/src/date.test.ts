import { describe, it, expect } from 'vitest'
import { monthRange, dueThisMonth, formatDate, referenceMonth, effectiveDueDate } from './date'

describe('monthRange', () => {
  it('retorna primeiro e último dia do mês de referência', () => {
    expect(monthRange(new Date('2026-06-15T12:00:00Z'))).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    })
  })
  it('fevereiro em ano bissexto', () => {
    expect(monthRange(new Date('2028-02-10T12:00:00Z'))).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    })
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

describe('referenceMonth', () => {
  it('normaliza data completa para dia 1', () => {
    expect(referenceMonth('2026-07-15')).toBe('2026-07-01')
  })
  it('aceita YYYY-MM', () => {
    expect(referenceMonth('2026-07')).toBe('2026-07-01')
  })
})

describe('effectiveDueDate', () => {
  it('dia normal permanece', () => {
    expect(effectiveDueDate(5, '2026-07-01')).toBe('2026-07-05')
  })
  it('dia 31 em mês de 30 dias vira o último dia', () => {
    expect(effectiveDueDate(31, '2026-06-01')).toBe('2026-06-30')
  })
  it('dia 31 em fevereiro vira 28 (não bissexto)', () => {
    expect(effectiveDueDate(31, '2026-02-01')).toBe('2026-02-28')
  })
})
