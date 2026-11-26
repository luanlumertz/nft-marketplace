import { z } from 'zod'
import { orderInputSchema } from './contracts'

export const checkoutDraftSchema = z.object({
  walletId: z.string(),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  provider: z.enum(['walletconnect', 'metamask', 'coinbase', '']),
  providerSelected: z.boolean().optional(),
  collector: z
    .object({
      name: z.string(),
      username: z.string(),
      email: z.string(),
      ensName: z.string(),
      profileName: z.string(),
      referralCode: z.string(),
      secondaryAddress: z.string(),
      notes: z.string(),
    })
    .partial(),
})
const attemptSchema = z.object({ key: z.uuid(), input: orderInputSchema })
export type SavedAttempt = z.infer<typeof attemptSchema>
export function readAttempt(userId: string): SavedAttempt | null {
  try {
    return attemptSchema.parse(
      JSON.parse(localStorage.getItem(`kurio:attempt:${userId}`) ?? 'null'),
    )
  } catch {
    return null
  }
}
export function saveAttempt(userId: string, attempt: SavedAttempt | null) {
  const key = `kurio:attempt:${userId}`
  if (attempt) localStorage.setItem(key, JSON.stringify(attempt))
  else localStorage.removeItem(key)
}
export function readDraft(userId: string) {
  try {
    return checkoutDraftSchema.parse(
      JSON.parse(localStorage.getItem(`kurio:checkout:${userId}`) ?? 'null'),
    )
  } catch {
    return null
  }
}
