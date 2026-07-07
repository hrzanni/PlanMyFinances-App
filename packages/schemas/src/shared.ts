import { z } from 'zod'

export const transactionType = z.enum(['receita', 'despesa'])
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data no formato YYYY-MM-DD')
export const isoMonth = z.string().regex(/^\d{4}-\d{2}$/, 'mês no formato YYYY-MM')
export const uuid = z.string().uuid()
export const money = z.number().positive('valor deve ser maior que zero')
