// Espelha apps/api/src/auth/dev-mode.ts e apps/web/src/lib/dev-mode.ts (FR-080..082).
// EXPO_PUBLIC_* é inlined em build time pelo Metro, equivalente ao NEXT_PUBLIC_* do Next.js.
export const isDevBypassEnabled = process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true'
