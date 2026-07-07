import { describe, it, expect } from 'vitest'
import { folderTotal } from './folders'

describe('folderTotal (RN-110)', () => {
  const txs = [
    { type: 'despesa' as const, value: '1480.00', folderId: 'trip' },
    { type: 'despesa' as const, value: '620.30', folderId: 'trip' },
    { type: 'despesa' as const, value: '240.50', folderId: 'trip' },
    { type: 'despesa' as const, value: '99.00', folderId: 'other' },
    { type: 'receita' as const, value: '500.00', folderId: 'trip' },
    { type: 'despesa' as const, value: '10.00', folderId: null },
  ]
  it('soma só despesas da pasta', () => {
    expect(folderTotal(txs, 'trip')).toBe(2340.8)
  })
  it('ignora receitas e outras pastas', () => {
    expect(folderTotal(txs, 'other')).toBe(99)
  })
  it('pasta sem transações soma 0', () => {
    expect(folderTotal(txs, 'empty')).toBe(0)
  })
})
