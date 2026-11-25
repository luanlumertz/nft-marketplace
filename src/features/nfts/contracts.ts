import { z } from 'zod'
import { collections } from './catalog-search'

// ETH permanece decimal em string; nunca converta valores monetarios para Number.
export const ethAmountSchema = z.string().regex(/^\d+(?:\.\d{1,18})?$/)

export const nftSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  priceEth: ethAmountSchema,
  available: z.number().int().nonnegative(),
  edition: z.string(),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  version: z.number().int().positive(),
  collection: z.enum(collections.map(([value]) => value)),
  listedAt: z.string(),
  popularity: z.number().int().nonnegative(),
  isNew: z.boolean(),
  isTrending: z.boolean(),
  rare: z.boolean(),
  previousPriceEth: ethAmountSchema.optional(),
})

const facetSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
})
export const nftListSchema = z.object({
  items: z.array(nftSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().positive(),
  facets: z.object({
    collections: z.array(facetSchema),
    networks: z.array(facetSchema),
  }),
  featured: z.array(nftSchema),
})

export const nftUpdatedSchema = z
  .object({
    eventId: z.string().uuid(),
    resourceId: z.string(),
    version: z.number().int().positive(),
    data: nftSchema,
  })
  .refine(
    (event) =>
      event.resourceId === event.data.id &&
      event.version === event.data.version,
  )

export type Nft = z.infer<typeof nftSchema>
export type NftList = z.infer<typeof nftListSchema>
export type NftUpdated = z.infer<typeof nftUpdatedSchema>

export interface ServerToClientEvents {
  'nft.updated': (event: NftUpdated) => void
}

export interface ClientToServerEvents {
  'catalog.subscribe': () => void
}
