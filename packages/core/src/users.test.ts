import { describe, expect, it } from 'vitest'
import { firstName } from './users'

describe('firstName', () => {
  it('extrai o primeiro nome de um nome composto', () => {
    expect(firstName('Hugo Zanni')).toBe('Hugo')
  })

  it('devolve o próprio nome quando é único', () => {
    expect(firstName('Hugo')).toBe('Hugo')
  })

  it('ignora espaços extras nas pontas e no meio', () => {
    expect(firstName('  Ana   Maria  ')).toBe('Ana')
  })

  it('devolve vazio para nome só de espaços', () => {
    expect(firstName('   ')).toBe('')
  })
})
