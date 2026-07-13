const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formata um número como moeda pt-BR/BRL (FR-093). */
export function formatCurrency(value: number): string {
  return brl.format(value)
}

/** Converte o `numeric` do Postgres (string) em número. Valores nulos viram 0. */
export function toNumber(value: string | null | undefined): number {
  if (value == null || value === '') return 0
  return Number(value)
}

/** Soma valores `numeric` (strings) com precisão de centavos. */
export function sumAmounts(values: Array<string | null | undefined>): number {
  const cents = values.reduce((acc: number, v) => acc + Math.round(toNumber(v) * 100), 0)
  return cents / 100
}
