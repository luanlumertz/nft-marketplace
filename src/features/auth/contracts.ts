import { z } from 'zod'
import type { SearchSchemaInput } from '@tanstack/react-router'

export const emailSchema = z
  .string()
  .trim()
  .email('Informe um e-mail válido.')
  .max(254)
  .transform((value) => value.toLowerCase())
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Informe sua senha.')
    .max(128, 'Use até 128 caracteres.'),
})
export const registerSchema = loginSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(3, 'Use pelo menos 3 caracteres.')
      .max(40, 'Use até 40 caracteres.'),
    password: z
      .string()
      .min(8, 'Use pelo menos 8 caracteres.')
      .max(128, 'Use até 128 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas precisam ser iguais.',
  })
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})
export const sessionSchema = z.object({
  user: userSchema.nullable(),
  expiresAt: z.number().nullable(),
})
export const authenticationSchema = sessionSchema.extend({
  token: z.string(),
  user: userSchema,
})
export type User = z.infer<typeof userSchema>
export type Session = z.infer<typeof sessionSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export const anonymousSession: Session = { user: null, expiresAt: null }

export function safeReturnTo(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return '/'
  try {
    const parsed = new URL(value, window.location.origin)
    if (
      parsed.origin !== window.location.origin ||
      /^\/(login|cadastro)(\/|$)/.test(parsed.pathname)
    )
      return '/'
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/'
  }
}

export function validateAuthSearch(
  raw: SearchSchemaInput & {
    redirect?: string
    favorite?: string
    reason?: 'expired'
  },
) {
  return {
    redirect: safeReturnTo(raw.redirect),
    favorite:
      typeof raw.favorite === 'string' ? raw.favorite.slice(0, 120) : undefined,
    reason: raw.reason === 'expired' ? ('expired' as const) : undefined,
  }
}
