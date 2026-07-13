// Espelha apps/api/src/auth/dev-mode.ts do lado do client (FR-080..082).
// NEXT_PUBLIC_* é inlined em build time, então isto já nasce fixo por ambiente.
export const isDevBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true'
