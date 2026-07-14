import { describe, expect, it } from 'vitest'
import { firstName, initials } from './users'

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

describe('initials', () => {
  it('usa primeira letra do primeiro e do último nome', () => {
    expect(initials('Hugo Zanni')).toBe('HZ')
    expect(initials('Ana Maria Braga')).toBe('AB')
  })

  it('usa uma letra só quando o nome é único', () => {
    expect(initials('Hugo')).toBe('H')
  })

  it('devolve maiúsculas mesmo com nome em minúsculas', () => {
    expect(initials('hugo zanni')).toBe('HZ')
  })

  it('ignora espaços extras e devolve vazio para nome só de espaços', () => {
    expect(initials('  ana   silva  ')).toBe('AS')
    expect(initials('   ')).toBe('')
  })
})
