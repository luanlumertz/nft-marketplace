import { isAxiosError } from 'axios'
import type { ZodError } from 'zod'

export type FieldErrors = Record<string, string[] | undefined>
export function validationErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path.at(-1) ?? 'form')
    ;(fields[key] ??= []).push(issue.message)
  }
  return fields
}
export function apiFailure(error: unknown): {
  message: string
  fieldErrors: FieldErrors
} {
  if (!error) return { message: '', fieldErrors: {} }
  return {
    message: isAxiosError(error)
      ? (error.response?.data?.message ??
        'Não foi possível salvar. Tente novamente.')
      : 'Não foi possível salvar. Tente novamente.',
    fieldErrors: isAxiosError(error)
      ? (error.response?.data?.fieldErrors ?? {})
      : {},
  }
}
