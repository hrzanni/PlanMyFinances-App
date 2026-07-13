import { formatCurrency, toNumber } from '@pmf/core'

/** Formata um numeric (string do Postgres) como BRL. */
export function money(value: string | number | null | undefined): string {
  return formatCurrency(typeof value === 'number' ? value : toNumber(value))
}

/** Mês corrente no formato YYYY-MM. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

/** Rótulo pt-BR de um mês YYYY-MM (ex.: "julho de 2026"). */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const label = new Date(Date.UTC(y!, m! - 1, 15)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 15))
  return d.toISOString().slice(0, 7)
}
