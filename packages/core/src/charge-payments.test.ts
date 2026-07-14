import { describe, it, expect } from 'vitest'
import { applyChargePayment, revertChargePayment } from './charge-payments'

describe('applyChargePayment', () => {
  it('soma o recebimento ao pago acumulado', () => {
    expect(applyChargePayment(100, 3, 50, 100)).toEqual({ newAmountPaid: 150, fullyPaid: false })
  })
  it('marca quitação exata', () => {
    expect(applyChargePayment(100, 3, 200, 100)).toEqual({ newAmountPaid: 300, fullyPaid: true })
  })
  it('rejeita recebimento que excede o total (RN-004)', () => {
    expect(applyChargePayment(100, 3, 250, 50.01)).toBeNull()
  })
  it('rejeita valor zero ou negativo', () => {
    expect(applyChargePayment(100, 3, 0, 0)).toBeNull()
    expect(applyChargePayment(100, 3, 0, -10)).toBeNull()
  })
  it('sem erro de ponto flutuante com centavos', () => {
    expect(applyChargePayment(487.5, 4, 975, 975)).toEqual({
      newAmountPaid: 1950,
      fullyPaid: true,
    })
    expect(applyChargePayment(0.1, 3, 0.1, 0.2)).toEqual({ newAmountPaid: 0.3, fullyPaid: true })
  })
})

describe('revertChargePayment', () => {
  it('subtrai o recebimento desfeito', () => {
    expect(revertChargePayment(150, 100)).toBe(50)
  })
  it('não deixa pago negativo', () => {
    expect(revertChargePayment(50, 100)).toBe(0)
  })
  it('sem erro de ponto flutuante com centavos', () => {
    expect(revertChargePayment(0.3, 0.1)).toBe(0.2)
  })
})
