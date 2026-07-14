export type BankPresetKey =
  | 'nubank'
  | 'inter'
  | 'banco_do_brasil'
  | 'santander'
  | 'caixa'
  | 'outro'

export interface BankPresetInfo {
  key: BankPresetKey
  label: string
  /** Monograma exibido no logo (marca estilizada, não o logotipo oficial). */
  mark: string
  /** Cor de fundo da marca. */
  color: string
  /** Cor do texto do monograma. */
  markColor: string
}

/** Bancos pré-cadastrados (fase 8.2), Nubank primeiro por decisão de produto. */
export const BANK_PRESETS: readonly BankPresetInfo[] = [
  { key: 'nubank', label: 'Nubank', mark: 'nu', color: '#820AD1', markColor: '#FFFFFF' },
  { key: 'inter', label: 'Inter', mark: 'in', color: '#FF7A00', markColor: '#FFFFFF' },
  {
    key: 'banco_do_brasil',
    label: 'Banco do Brasil',
    mark: 'BB',
    color: '#003DA5',
    markColor: '#FFEF38',
  },
  { key: 'santander', label: 'Santander', mark: 'S', color: '#EC0000', markColor: '#FFFFFF' },
  { key: 'caixa', label: 'Caixa', mark: 'CX', color: '#005CA9', markColor: '#F39200' },
  { key: 'outro', label: 'Outro', mark: '💳', color: '#54545C', markColor: '#FFFFFF' },
] as const

export function bankPresetInfo(key: string): BankPresetInfo {
  return BANK_PRESETS.find((b) => b.key === key) ?? BANK_PRESETS[BANK_PRESETS.length - 1]!
}
