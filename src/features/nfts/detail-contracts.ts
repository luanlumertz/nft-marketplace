import { z } from 'zod'
import type { SearchSchemaInput } from '@tanstack/react-router'
import { ethAmountSchema, nftSchema } from './contracts'
import { parseCatalogSearch, type CatalogSearch } from './catalog-search'

export const editionSchema = z.object({
  id: z.string(),
  label: z.string(),
  available: z.number().int().nonnegative(),
  priceEth: ethAmountSchema,
})
export const detailSchema = nftSchema.extend({
  shortDescription: z.string(),
  gallery: z.array(z.object({ url: z.string(), alt: z.string() })).min(1),
  editions: z.array(editionSchema).min(1),
  defaultEditionId: z.string(),
  tokenId: z.string(),
  collectionName: z.string(),
  attributes: z.array(z.string()),
  fullDescription: z.array(z.string()),
  networkDescription: z.string(),
  contractAddress: z.string(),
  royalties: z.string(),
  rating: z.number(),
  reviews: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      rating: z.number().min(1).max(5),
      text: z.string(),
      date: z.string(),
    }),
  ),
})
export type NftDetail = z.infer<typeof detailSchema>
export type Edition = z.infer<typeof editionSchema>
export const purchaseSelectionSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: z.number().int().positive(),
})
export type PurchaseSelection = z.infer<typeof purchaseSelectionSchema>
export function weiToEth(value: bigint) {
  const whole = value / 10n ** 18n
  const fraction = (value % 10n ** 18n)
    .toString()
    .padStart(18, '0')
    .replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : String(whole)
}
export function parseDetailSearch(raw: Record<string, unknown>) {
  return {
    ...parseCatalogSearch(raw),
    edition:
      typeof raw.edition === 'string' ? raw.edition.slice(0, 40) : undefined,
    quantity: z.coerce
      .number()
      .int()
      .min(1)
      .max(999)
      .catch(1)
      .parse(raw.quantity),
  }
}
export function validateDetailSearch(
  raw: SearchSchemaInput &
    Partial<CatalogSearch> & { edition?: string; quantity?: number },
) {
  return parseDetailSearch(raw)
}
