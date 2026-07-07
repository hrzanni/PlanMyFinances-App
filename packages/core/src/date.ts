function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`
}

/** Último dia do mês (m em 1–12). */
function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** Primeiro e último dia do mês da data de referência (RN-001/002). */
export function monthRange(ref: Date): { from: string; to: string } {
  const y = ref.getUTCFullYear()
  const m = ref.getUTCMonth() + 1
  return { from: isoDate(y, m, 1), to: isoDate(y, m, lastDayOfMonth(y, m)) }
}

/** true se due_date (ISO) cai no mês/ano da referência; null nunca vence (RN-005). */
export function dueThisMonth(dueDate: string | null, ref: Date): boolean {
  if (!dueDate) return false
  const [y, m] = dueDate.split('-').map(Number)
  return y === ref.getUTCFullYear() && m === ref.getUTCMonth() + 1
}

/** ISO (YYYY-MM-DD) → DD/MM/YYYY (FR-093). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Normaliza uma data ISO para o dia 1 do mês (RN-102). Aceita YYYY-MM-DD ou YYYY-MM. */
export function referenceMonth(dateIso: string): string {
  const [y, m] = dateIso.split('-')
  return `${y}-${m}-01`
}

/**
 * Data efetiva de vencimento de um gasto fixo no mês (spec amendment, edge case):
 * due_day 31 em mês de 30 dias (ou fevereiro) vence no último dia do mês.
 */
export function effectiveDueDate(dueDay: number, monthIso: string): string {
  const [y, m] = monthIso.split('-').map(Number)
  const year = y as number
  const month = m as number
  const day = Math.min(dueDay, lastDayOfMonth(year, month))
  return isoDate(year, month, day)
}
