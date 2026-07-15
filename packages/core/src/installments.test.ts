import { describe, it, expect } from 'vitest'
import {
  emptyInstallmentDraft,
  emptyInvoiceDraft,
  installmentTotals,
  isValidAmountPaid,
  parseInstallmentDraft,
  parseInvoiceDraft,
  validateInstallmentDraft,
  validateInvoiceDraft,
} from './installments'

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

function draft(patch: Partial<typeof emptyInstallmentDraft>) {
  return { ...emptyInstallmentDraft, name: 'X', amountPerInstallment: '100', ...patch }
}

describe('validateInstallmentDraft', () => {
  it('aceita rascunho válido', () => {
    expect(validateInstallmentDraft(draft({}))).toBeNull()
  })
  it('exige valor da parcela', () => {
    expect(validateInstallmentDraft(draft({ amountPerInstallment: '' }))).toMatch(/parcela/)
    expect(validateInstallmentDraft(draft({ amountPerInstallment: '0' }))).toMatch(/parcela/)
  })
  it('exige ao menos 1 parcela', () => {
    expect(validateInstallmentDraft(draft({ totalInstallments: '0' }))).toMatch(/ao menos 1/)
  })
  it('rejeita pago negativo', () => {
    expect(validateInstallmentDraft(draft({ amountPaid: '-1' }))).toMatch(/negativo/)
  })
  it('rejeita pago acima do total, aceitando vírgula (RN-004)', () => {
    expect(
      validateInstallmentDraft(draft({ totalInstallments: '2', amountPaid: '200,01' })),
    ).toMatch(/exceder/)
    expect(
      validateInstallmentDraft(draft({ totalInstallments: '2', amountPaid: '200,00' })),
    ).toBeNull()
  })
  it('rejeita vencimento fora do formato AAAA-MM-DD', () => {
    expect(validateInstallmentDraft(draft({ dueDate: '10/07/2026' }))).toMatch(/AAAA-MM-DD/)
    expect(validateInstallmentDraft(draft({ dueDate: '2026-07-10' }))).toBeNull()
  })
})

describe('parseInstallmentDraft', () => {
  it('normaliza vírgula e converte números', () => {
    expect(
      parseInstallmentDraft(
        draft({ amountPerInstallment: '487,50', totalInstallments: '4', amountPaid: '975' }),
      ),
    ).toEqual({
      description: undefined,
      amountPerInstallment: 487.5,
      totalInstallments: 4,
      amountPaid: 975,
      dueDate: undefined,
    })
  })
  it('campos opcionais vazios viram undefined e pago vazio vira 0', () => {
    expect(parseInstallmentDraft(draft({ amountPaid: '', dueDate: '' }))).toMatchObject({
      amountPaid: 0,
      dueDate: undefined,
      description: undefined,
    })
  })
})

function invoiceDraft(patch: Partial<typeof emptyInvoiceDraft>) {
  return {
    ...emptyInvoiceDraft,
    amountPerInstallment: '100',
    firstDueDate: '2026-07-10',
    cardId: 'card-1',
    ...patch,
  }
}

describe('validateInvoiceDraft', () => {
  it('aceita rascunho válido', () => {
    expect(validateInvoiceDraft(invoiceDraft({}))).toBeNull()
  })
  it('exige valor da parcela', () => {
    expect(validateInvoiceDraft(invoiceDraft({ amountPerInstallment: '' }))).toMatch(/parcela/)
    expect(validateInvoiceDraft(invoiceDraft({ amountPerInstallment: '0' }))).toMatch(/parcela/)
  })
  it('exige ao menos 1 parcela', () => {
    expect(validateInvoiceDraft(invoiceDraft({ totalInstallments: '0' }))).toMatch(/ao menos 1/)
  })
  it('exige o primeiro vencimento', () => {
    expect(validateInvoiceDraft(invoiceDraft({ firstDueDate: '' }))).toMatch(/primeiro vencimento/)
  })
  it('rejeita vencimento fora do formato AAAA-MM-DD', () => {
    expect(validateInvoiceDraft(invoiceDraft({ firstDueDate: '10/07/2026' }))).toMatch(
      /AAAA-MM-DD/,
    )
    expect(validateInvoiceDraft(invoiceDraft({ firstDueDate: '2026-07-10' }))).toBeNull()
  })
  it('exige cartão selecionado', () => {
    expect(validateInvoiceDraft(invoiceDraft({ cardId: '' }))).toMatch(/cartão/)
  })
})

describe('parseInvoiceDraft', () => {
  it('normaliza vírgula e converte números', () => {
    expect(
      parseInvoiceDraft(
        invoiceDraft({ amountPerInstallment: '487,50', totalInstallments: '4' }),
      ),
    ).toEqual({
      description: undefined,
      amountPerInstallment: 487.5,
      totalInstallments: 4,
      firstDueDate: '2026-07-10',
      categoryId: undefined,
      cardId: 'card-1',
    })
  })
  it('campos opcionais vazios viram undefined', () => {
    expect(
      parseInvoiceDraft(invoiceDraft({ description: '', categoryId: '' })),
    ).toMatchObject({
      description: undefined,
      categoryId: undefined,
      cardId: 'card-1',
    })
  })
})
