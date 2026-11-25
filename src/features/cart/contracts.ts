import { z } from 'zod'
import { ethAmountSchema } from '@/features/nfts/contracts'
import { purchaseSelectionSchema } from '@/features/nfts/detail-contracts'

export const cartSelectionSchema = purchaseSelectionSchema.extend({
  quantity: z.number().int().min(1).max(999),
})
export const couponInputSchema = z.object({
  code: z.string().trim().toUpperCase().min(1).max(40).nullable(),
})
export const cartItemSchema = purchaseSelectionSchema.extend({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  tokenId: z.string(),
  editionLabel: z.string(),
  unitPriceEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  available: z.number().int().nonnegative(),
  nftVersion: z.number().int().positive(),
  issue: z.enum(['sold-out', 'insufficient']).nullable(),
})
export const cartSchema = z.object({
  revision: z.number().int().nonnegative(),
  items: z.array(cartItemSchema),
  quote: z.object({
    version: z.string(),
    subtotalEth: ethAmountSchema,
    discountEth: ethAmountSchema,
    networkFeeEth: ethAmountSchema,
    totalEth: ethAmountSchema,
    coupon: z.object({ code: z.string(), valid: z.boolean() }).nullable(),
    canCheckout: z.boolean(),
  }),
})
export type Cart = z.infer<typeof cartSchema>
export type CartItem = z.infer<typeof cartItemSchema>
export type CartSelection = z.infer<typeof cartSelectionSchema>
export type CartCommand =
  | { type: 'add'; selection: CartSelection }
  | { type: 'quantity'; selection: CartSelection }
  | { type: 'remove'; nftId: string; editionId: string }
  | { type: 'coupon'; code: string | null }
