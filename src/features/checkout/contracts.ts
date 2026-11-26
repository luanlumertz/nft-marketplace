import { z } from 'zod'
import { cartSchema } from '@/features/cart/contracts'
import { profileFieldsSchema, walletSchema } from '@/features/account/contracts'

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export const providerSchema = z.enum(['walletconnect', 'metamask', 'coinbase'])
export const collectorSchema = profileFieldsSchema
  .pick({
    name: true,
    username: true,
    email: true,
    ensName: true,
  })
  .extend({
    profileName: z.string().trim().min(1, 'Informe o nome do perfil.').max(40),
    referralCode: z
      .string()
      .trim()
      .min(1, 'Informe o código de indicação.')
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Use letras, números, traços ou sublinhados.'),
    secondaryAddress: z.string().trim().max(100),
    notes: z.string().trim().max(500, 'Use até 500 caracteres.'),
  })
export const connectionInputSchema = z.object({
  walletId: z.string().min(1),
  network: networkSchema,
  provider: providerSchema,
})
export const connectionSchema = connectionInputSchema.extend({
  id: z.uuid(),
  address: z.string(),
  expiresAt: z.number(),
})
export const orderInputSchema = z.object({
  quoteVersion: z.string().min(1),
  connectionId: z.uuid(),
  collector: collectorSchema,
})
export const orderSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  attemptId: z.uuid(),
  version: z.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'declined']),
  createdAt: z.number(),
  settledAt: z.number().nullable(),
  transactionId: z.string().nullable(),
  reason: z.string().nullable(),
  collector: collectorSchema,
  wallet: walletSchema,
  cart: cartSchema,
})
export const orderUpdatedSchema = z.object({
  eventId: z.uuid(),
  resourceId: z.uuid(),
  userId: z.string(),
  version: z.number().int().positive(),
  status: orderSchema.shape.status,
})
export type Collector = z.infer<typeof collectorSchema>
export type WalletConnection = z.infer<typeof connectionSchema>
export type ConnectionInput = z.infer<typeof connectionInputSchema>
export type OrderInput = z.infer<typeof orderInputSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderUpdated = z.infer<typeof orderUpdatedSchema>
