export type PasswordStrength = 'fraca' | 'moderada' | 'forte'

const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]

/**
 * Força da senha por comprimento e variedade de classes (minúscula, maiúscula,
 * dígito, símbolo): fraca = <8 chars ou 1 classe; forte = 12+ chars e 3+ classes.
 */
export function passwordStrength(password: string): PasswordStrength {
  const classes = CHARACTER_CLASSES.filter((re) => re.test(password)).length
  if (password.length < 8 || classes < 2) return 'fraca'
  if (password.length >= 12 && classes >= 3) return 'forte'
  return 'moderada'
}

/** Senha aceitável para cadastro: moderada ou forte. */
export function isAcceptablePassword(password: string): boolean {
  return passwordStrength(password) !== 'fraca'
}
