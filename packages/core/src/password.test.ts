import { describe, expect, it } from 'vitest'
import { passwordStrength, isAcceptablePassword } from './password'

describe('passwordStrength', () => {
  it('classifica como fraca senha com menos de 8 caracteres', () => {
    expect(passwordStrength('Ab1!')).toBe('fraca')
  })

  it('classifica como fraca senha longa com uma única classe de caractere', () => {
    expect(passwordStrength('abcdefghij')).toBe('fraca')
    expect(passwordStrength('12345678901')).toBe('fraca')
  })

  it('classifica como moderada senha de 8+ caracteres com duas classes', () => {
    expect(passwordStrength('abcd1234')).toBe('moderada')
  })

  it('classifica como moderada senha com três classes mas curta demais para forte', () => {
    expect(passwordStrength('Abcd1234')).toBe('moderada')
  })

  it('classifica como forte senha de 12+ caracteres com três ou mais classes', () => {
    expect(passwordStrength('Abcd1234efgh')).toBe('forte')
    expect(passwordStrength('Abcd1234!efg')).toBe('forte')
  })

  it('devolve fraca para senha vazia', () => {
    expect(passwordStrength('')).toBe('fraca')
  })
})

describe('isAcceptablePassword', () => {
  it('rejeita senha fraca', () => {
    expect(isAcceptablePassword('abcdefgh')).toBe(false)
  })

  it('aceita senha moderada ou forte', () => {
    expect(isAcceptablePassword('abcd1234')).toBe(true)
    expect(isAcceptablePassword('Abcd1234efgh')).toBe(true)
  })
})
