/** Primeiro nome para saudação ("Hugo Zanni" → "Hugo"). Vazio se o nome for só espaços. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ''
}
