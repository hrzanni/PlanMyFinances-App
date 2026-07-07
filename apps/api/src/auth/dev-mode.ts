// Modo DEV (FR-080..082): bypass de auth apenas fora de produção.
export const DEV_USER_ID = 'dev-user-000000000001'

export function isDevBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.AUTH_BYPASS === 'true'
}

/** Aborta o boot se a flag estiver ligada em produção (FR-081 / SC-005). */
export function assertDevBypassNotInProduction(): void {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_BYPASS === 'true') {
    throw new Error('AUTH_BYPASS não pode estar ativo em produção. Abortando o boot.')
  }
}
