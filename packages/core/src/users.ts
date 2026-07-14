/** Primeiro nome para saudação ("Hugo Zanni" → "Hugo"). Vazio se o nome for só espaços. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

/** Iniciais para avatar ("Hugo Zanni" → "HZ", "Hugo" → "H"). Vazio se o nome for só espaços. */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0]![0]!
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}
