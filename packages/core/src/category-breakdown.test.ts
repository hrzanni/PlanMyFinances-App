import { describe, it, expect } from 'vitest'
import { expenseByCategory, foldCategorySlices } from './category-breakdown'

describe('expenseByCategory', () => {
  it('agrupa despesas por categoria com total e percentual, incluindo sem categoria', () => {
    const slices = expenseByCategory([
      { type: 'despesa', value: '60.00', categoryId: 'c1', categoryName: 'Alimentação' },
      { type: 'despesa', value: '15.00', categoryId: 'c1', categoryName: 'Alimentação' },
      { type: 'despesa', value: '20.00', categoryId: 'c2', categoryName: 'Transporte' },
      { type: 'despesa', value: '5.00', categoryId: null, categoryName: null },
      { type: 'receita', value: '999.00', categoryId: 'c3', categoryName: 'Renda' },
    ])
    expect(slices).toEqual([
      { categoryId: 'c1', categoryName: 'Alimentação', total: 75, percent: 75 },
      { categoryId: 'c2', categoryName: 'Transporte', total: 20, percent: 20 },
      { categoryId: null, categoryName: null, total: 5, percent: 5 },
    ])
  })

  it('percentuais com arredondamento de 1 casa', () => {
    const slices = expenseByCategory([
      { type: 'despesa', value: '1.00', categoryId: 'c1', categoryName: 'A' },
      { type: 'despesa', value: '2.00', categoryId: 'c2', categoryName: 'B' },
    ])
    expect(slices.map((s) => s.percent)).toEqual([66.7, 33.3])
  })

  it('soma centavos sem erro de float', () => {
    const slices = expenseByCategory([
      { type: 'despesa', value: '0.10', categoryId: 'c1', categoryName: 'A' },
      { type: 'despesa', value: '0.20', categoryId: 'c1', categoryName: 'A' },
    ])
    expect(slices[0]?.total).toBe(0.3)
  })

  it('sem despesas retorna vazio', () => {
    expect(expenseByCategory([])).toEqual([])
    expect(
      expenseByCategory([{ type: 'receita', value: '10.00', categoryId: null, categoryName: null }]),
    ).toEqual([])
  })
})

describe('foldCategorySlices', () => {
  const slice = (id: string | null, name: string | null, total: number, percent: number) => ({
    categoryId: id,
    categoryName: name,
    total,
    percent,
  })

  it('mantém tudo quando cabe no limite', () => {
    const slices = [slice('c1', 'A', 60, 60), slice(null, null, 40, 40)]
    expect(foldCategorySlices(slices, 5)).toEqual(slices)
  })

  it('dobra o excedente de categorias nomeadas em "other", preservando sem categoria', () => {
    const folded = foldCategorySlices(
      [
        slice('c1', 'A', 40, 40),
        slice('c2', 'B', 25, 25),
        slice('c3', 'C', 15, 15),
        slice(null, null, 12, 12),
        slice('c4', 'D', 5, 5),
        slice('c5', 'E', 3, 3),
      ],
      3,
    )
    expect(folded).toEqual([
      slice('c1', 'A', 40, 40),
      slice('c2', 'B', 25, 25),
      slice('c3', 'C', 15, 15),
      { categoryId: 'other', categoryName: null, total: 8, percent: 8 },
      slice(null, null, 12, 12),
    ])
  })
})
