import { formatCurrency, toNumber } from '@pmf/core'

export function money(value: string | number | null | undefined): string {
  return formatCurrency(typeof value === 'number' ? value : toNumber(value))
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

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
  return new Date(Date.UTC(y!, m! - 1 + delta, 15)).toISOString().slice(0, 7)
}
