import { describe, expect, it } from 'vitest'
import {
  deriveInstallments,
  installmentDueDate,
  installmentForMonth,
  invoiceMonthSummary,
  isInvoiceClosed,
} from './invoice-installments'

const sched = { amountPerInstallment: 250, totalInstallments: 10, firstDueDate: '2026-04-05' }
const pay = (n: number, amount = 250, paidOn = '2026-07-01', id = `p${n}`) => ({
  id, installmentNumber: n, amount, paidOn,
})

describe('installmentDueDate', () => {
  it('parcela 1 = primeiro vencimento', () => {
    expect(installmentDueDate('2026-04-05', 1)).toBe('2026-04-05')
  })
  it('soma meses e vira o ano', () => {
    expect(installmentDueDate('2026-11-15', 3)).toBe('2027-01-15')
  })
  it('clampa fim de mês (31 jan → 28 fev)', () => {
    expect(installmentDueDate('2026-01-31', 2)).toBe('2026-02-28')
  })
  it('clampa fev em ano bissexto', () => {
    expect(installmentDueDate('2027-12-31', 3)).toBe('2028-02-29')
  })
})

describe('installmentForMonth', () => {
  it('acha a parcela do mês', () => {
    expect(installmentForMonth(sched, '2026-07')).toBe(4)
  })
  it('null fora do cronograma', () => {
    expect(installmentForMonth(sched, '2026-03')).toBeNull()
    expect(installmentForMonth(sched, '2027-02')).toBeNull()
  })
})

describe('deriveInstallments', () => {
  it('marca pagas, atrasadas e pendentes', () => {
    const st = deriveInstallments(sched, [pay(1), pay(2)], '2026-07-14')
    expect(st).toHaveLength(10)
    expect(st[0]).toMatchObject({ number: 1, paid: true, amountPaid: 250, paymentId: 'p1', overdue: false })
    expect(st[2]).toMatchObject({ number: 3, paid: false, overdue: true, dueDate: '2026-06-05' }) // venceu, não paga
    expect(st[3]).toMatchObject({ number: 4, paid: false, overdue: true, dueDate: '2026-07-05' }) // venceu no mês atual
    expect(st[4]).toMatchObject({ number: 5, paid: false, overdue: false })
  })
  it('permite pagamento fora de ordem', () => {
    const st = deriveInstallments(sched, [pay(3)], '2026-04-01')
    expect(st[2]!.paid).toBe(true)
    expect(st[0]!.paid).toBe(false)
  })
})

describe('invoiceMonthSummary', () => {
  it('soma em centavos sem erro de float', () => {
    const rows = [
      { schedule: { amountPerInstallment: 0.1, totalInstallments: 3, firstDueDate: '2026-07-01' }, payments: [] },
      { schedule: { amountPerInstallment: 0.2, totalInstallments: 3, firstDueDate: '2026-07-02' }, payments: [pay(1, 0.2)] },
    ]
    const s = invoiceMonthSummary(rows, '2026-07', '2026-06-30')
    expect(s).toEqual({ due: 0.1, paidAmt: 0.2, overdue: 0, nPend: 1, nPaid: 1, total: 0.3 })
  })
  it('conta atraso apenas de parcela vencida e não paga', () => {
    const s = invoiceMonthSummary([{ schedule: sched, payments: [] }], '2026-07', '2026-07-14')
    expect(s).toMatchObject({ due: 250, overdue: 250, nPend: 1, nPaid: 0 })
  })
})

describe('isInvoiceClosed', () => {
  it('fechada quando toda parcela tem pagamento', () => {
    const p = [1, 2, 3].map((n) => pay(n))
    expect(isInvoiceClosed({ ...sched, totalInstallments: 3 }, p)).toBe(true)
    expect(isInvoiceClosed({ ...sched, totalInstallments: 4 }, p)).toBe(false)
  })
})
