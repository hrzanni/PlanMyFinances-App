import { describe, expect, it } from 'vitest'
import {
  chargeEffectiveState,
  chargesKpis,
  deriveChargeInstallments,
  nextUnpaidChargeInstallment,
} from './charge-installments'

const charge = (patch: Partial<Parameters<typeof deriveChargeInstallments>[0]> = {}) => ({
  amountPerInstallment: 200,
  totalInstallments: 6,
  amountPaid: 400,
  dueDate: '2026-05-10',
  ...patch,
})

describe('deriveChargeInstallments', () => {
  it('null quando não há dueDate', () => {
    expect(deriveChargeInstallments(charge({ dueDate: null }), '2026-07-14')).toBeNull()
  })

  it('marca pagas em ordem a partir de amountPaid acumulado, e atrasada a próxima vencida', () => {
    const st = deriveChargeInstallments(charge(), '2026-07-14')
    expect(st).toHaveLength(6)
    expect(st![0]).toMatchObject({ number: 1, dueDate: '2026-05-10', paid: true, overdue: false })
    expect(st![1]).toMatchObject({ number: 2, dueDate: '2026-06-10', paid: true, overdue: false })
    expect(st![2]).toMatchObject({ number: 3, dueDate: '2026-07-10', paid: false, overdue: true })
    expect(st![3]).toMatchObject({ number: 4, dueDate: '2026-08-10', paid: false, overdue: false })
  })

  it('amountPaid não múltiplo exato da parcela conta só as inteiras', () => {
    const st = deriveChargeInstallments(charge({ amountPaid: 450 }), '2026-04-01')
    expect(st![0]!.paid).toBe(true)
    expect(st![1]!.paid).toBe(true)
    expect(st![2]!.paid).toBe(false)
  })
})

describe('chargeEffectiveState', () => {
  it('pago quando status é pago', () => {
    expect(chargeEffectiveState({ ...charge(), status: 'pago' }, '2026-07-14')).toBe('pago')
  })

  it('pago quando totalmente quitada mesmo com status diferente', () => {
    expect(
      chargeEffectiveState({ ...charge({ amountPaid: 1200 }), status: 'pendente' }, '2026-07-14'),
    ).toBe('pago')
  })

  it('atrasada quando há parcela vencida não paga', () => {
    expect(chargeEffectiveState({ ...charge(), status: 'pendente' }, '2026-07-14')).toBe('atrasada')
  })

  it('sem cronograma, atrasada quando dueDate já passou', () => {
    expect(
      chargeEffectiveState({ ...charge({ dueDate: '2026-01-01' }), status: 'pendente' }, '2026-07-14'),
    ).toBe('atrasada')
  })

  it('cobrado/pendente quando em dia', () => {
    expect(
      chargeEffectiveState({ ...charge({ dueDate: '2026-08-10' }), status: 'cobrado' }, '2026-07-14'),
    ).toBe('cobrado')
    expect(
      chargeEffectiveState({ ...charge({ dueDate: '2026-08-10' }), status: 'pendente' }, '2026-07-14'),
    ).toBe('pendente')
  })
})

describe('nextUnpaidChargeInstallment', () => {
  it('retorna a próxima parcela em aberto', () => {
    expect(nextUnpaidChargeInstallment(charge(), '2026-07-14')).toEqual({
      number: 3,
      dueDate: '2026-07-10',
      amount: 200,
    })
  })

  it('null sem cronograma ou já quitada', () => {
    expect(nextUnpaidChargeInstallment(charge({ dueDate: null }), '2026-07-14')).toBeNull()
    expect(nextUnpaidChargeInstallment(charge({ amountPaid: 1200 }), '2026-07-14')).toBeNull()
  })
})

describe('chargesKpis', () => {
  it('agrega a receber/recebido/vence no mês (exclui pago) e conta atrasadas', () => {
    const rows = [
      { ...charge(), status: 'pendente' }, // remaining 800, atrasada
      { ...charge({ dueDate: '2026-08-10', amountPaid: 1200 }), status: 'pago' }, // quitada, some do "a receber"
      { ...charge({ dueDate: '2026-07-20', amountPaid: 0 }), status: 'cobrado' }, // remaining 1200, vence no mês, não atrasada
    ]
    const kpis = chargesKpis(rows, '2026-07-14')
    expect(kpis.received).toBe(400 + 1200 + 0)
    expect(kpis.receivable).toBe(800 + 1200)
    expect(kpis.dueThisMonth).toBe(1200)
    expect(kpis.overdueCount).toBe(1)
  })
})
