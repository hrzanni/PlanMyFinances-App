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
