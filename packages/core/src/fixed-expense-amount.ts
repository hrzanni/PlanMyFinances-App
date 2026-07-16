/** Um fixo existe no mês se ele já começou e (se encerrado) ainda não passou do último mês ativo. */
export function isFixedExpenseActiveInMonth(
  effectiveFrom: string,
  effectiveUntil: string | null,
  month: string,
): boolean {
  return month >= effectiveFrom && (effectiveUntil == null || month <= effectiveUntil)
}

export interface AmountHistoryEntry {
  amount: string
  effectiveFrom: string
}

/** Valor vigente no mês: a entrada de effectiveFrom mais recente que seja <= month (RN reajuste). */
export function resolveAmountForMonth(
  history: AmountHistoryEntry[],
  month: string,
): string | null {
  let resolved: AmountHistoryEntry | null = null
  for (const entry of history) {
    if (entry.effectiveFrom > month) continue
    if (!resolved || entry.effectiveFrom > resolved.effectiveFrom) resolved = entry
  }
  return resolved?.amount ?? null
}
