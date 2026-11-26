import { z } from 'zod'
import { purchaseSelectionSchema } from '@/features/nfts/detail-contracts'
import {
  connectionSchema,
  orderInputSchema,
  orderSchema,
} from '@/features/checkout/contracts'

const cartStateSchema = z.object({
  revision: z.number().int().nonnegative(),
  items: z.array(purchaseSelectionSchema),
  coupon: z.string().nullable(),
})
const savedOrderSchema = z.object({
  order: orderSchema,
  input: orderInputSchema,
  dueAt: z.number().nullable(),
  outcome: z.enum(['confirmed', 'declined']),
})
const schema = z.object({
  carts: z.record(z.string(), cartStateSchema),
  orders: z.record(z.string(), savedOrderSchema),
  inventory: z
    .record(
      z.string(),
      z.object({
        sold: z.number().int().nonnegative(),
        version: z.number().int().nonnegative(),
        editions: z.record(z.string(), z.number().int().nonnegative()),
      }),
    )
    .default({}),
  connections: z.record(
    z.string(),
    connectionSchema.extend({ userId: z.string(), token: z.string() }),
  ),
})
type CommerceState = z.infer<typeof schema>
const key = 'kurio:commerce:v1'
const empty = (): CommerceState => ({
  carts: {},
  orders: {},
  connections: {},
  inventory: {},
})
function restore(): CommerceState {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return schema.parse(JSON.parse(raw))
    // Mantém os carrinhos criados antes da introdução dos pedidos.
    return {
      ...empty(),
      carts: z
        .record(z.string(), cartStateSchema)
        .parse(JSON.parse(localStorage.getItem('kurio:carts:v1') ?? '{}')),
    }
  } catch {
    return empty()
  }
}
let state = restore()
export const commerce = {
  read: () => state,
  change<T>(mutate: (draft: CommerceState) => T): T {
    const draft = structuredClone(state)
    const result = mutate(draft)
    localStorage.setItem(key, JSON.stringify(draft))
    state = draft
    return result
  },
  reset() {
    const next = empty()
    localStorage.setItem(key, JSON.stringify(next))
    state = next
    localStorage.removeItem('kurio:carts:v1')
  },
}
