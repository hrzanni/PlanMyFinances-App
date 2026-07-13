import { z } from 'zod'

export const signupInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8, 'senha deve ter ao menos 8 caracteres').max(128),
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

export const forgotPasswordInput = z.object({
  email: z.string().email(),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInput>

export const resetPasswordInput = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordInput>
