import { z } from 'zod'
import { isAcceptablePassword } from '@pmf/core'

export const genderValues = ['feminino', 'masculino', 'outro', 'prefiro_nao_informar'] as const
export type Gender = (typeof genderValues)[number]
export const genderSchema = z.enum(genderValues)

/** Data de nascimento em AAAA-MM-DD, entre 1900 e hoje. */
export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar em AAAA-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10)
  }, 'data de nascimento inválida')

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9()\s-]{8,20}$/, 'telefone inválido')

const passwordSchema = z
  .string()
  .min(8, 'senha deve ter ao menos 8 caracteres')
  .max(128)
  .refine(isAcceptablePassword, 'senha fraca: misture letras, números ou símbolos')

export const signupInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: passwordSchema,
  birthDate: birthDateSchema.optional(),
  gender: genderSchema.optional(),
  phone: phoneSchema.optional(),
})
export type SignupInput = z.infer<typeof signupInput>

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginInput>

export const updateUserNameInput = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
})
export type UpdateUserNameInput = z.infer<typeof updateUserNameInput>

export const updateUserProfileInput = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  birthDate: birthDateSchema.nullable().optional(),
  gender: genderSchema.nullable().optional(),
  phone: phoneSchema.nullable().optional(),
})
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInput>

export const forgotPasswordInput = z.object({
  email: z.string().email(),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInput>

export const resetPasswordInput = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})
export type ResetPasswordInput = z.infer<typeof resetPasswordInput>
