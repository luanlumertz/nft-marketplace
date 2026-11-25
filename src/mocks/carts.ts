import { z } from 'zod'
import { cartSchema, type Cart } from '@/features/cart/contracts'
import { purchaseSelectionSchema } from '@/features/nfts/detail-contracts'
import { ethToWei } from '@/features/nfts/catalog-search'
import { weiToEth } from '@/features/nfts/detail-contracts'
import { detailFor } from './nft-details'
import { mockStore } from './store'

const storageKey = 'kurio:carts:v1'
const storedCartSchema = z.object({
  revision: z.number().int().nonnegative(),
  items: z.array(purchaseSelectionSchema),
  coupon: z.string().nullable(),
})
const storageSchema = z.record(z.string(), storedCartSchema)
type StoredCart = z.infer<typeof storedCartSchema>
function restore() {
  try {
    return storageSchema.parse(
      JSON.parse(localStorage.getItem(storageKey) ?? '{}'),
    )
  } catch {
    return {}
  }
}
let state = restore()
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state))
}
function get(owner: string): StoredCart {
  return (state[owner] ??= { revision: 0, items: [], coupon: null })
}
function edition(nftId: string, editionId: string) {
  const nft = mockStore.getState().nfts.find((item) => item.id === nftId)
  const detail = nft && detailFor(nft)
  const selected = detail?.editions.find((item) => item.id === editionId)
  return detail && selected ? { nft: detail, selected } : null
}
export function couponError(code: string) {
  if (code === 'EXPIRADO' || mockStore.getState().scenario === 'coupon-expired')
    return { code: 'COUPON_EXPIRED', message: 'Este cupom expirou.' }
  if (code !== 'KURIO10' || mockStore.getState().scenario === 'coupon-invalid')
    return { code: 'COUPON_INVALID', message: 'Código promocional inválido.' }
  return null
}
export const carts = {
  snapshot(owner: string): Cart {
    const cart = get(owner)
    const items = cart.items.flatMap((item) => {
      const source = edition(item.nftId, item.editionId)
      if (!source) return []
      const { nft, selected } = source
      return [
        {
          ...item,
          id: `${item.nftId}:${item.editionId}`,
          name: nft.name,
          imageUrl: nft.imageUrl,
          tokenId: nft.tokenId,
          editionLabel: selected.label,
          unitPriceEth: selected.priceEth,
          totalEth: weiToEth(
            ethToWei(selected.priceEth) * BigInt(item.quantity),
          ),
          available: selected.available,
          nftVersion: nft.version,
          issue:
            selected.available === 0
              ? ('sold-out' as const)
              : item.quantity > selected.available
                ? ('insufficient' as const)
                : null,
        },
      ]
    })
    const subtotal = items.reduce(
      (sum, item) => sum + ethToWei(item.totalEth),
      0n,
    )
    const validCoupon = !!cart.coupon && !couponError(cart.coupon)
    const discount = validCoupon ? subtotal / 10n : 0n
    const fee = items.length ? ethToWei('0.016') : 0n
    return cartSchema.parse({
      revision: cart.revision,
      items,
      quote: {
        version: `${cart.revision}:${items.map((item) => `${item.id}@${item.nftVersion}`).join(',')}:${validCoupon}`,
        subtotalEth: weiToEth(subtotal),
        discountEth: weiToEth(discount),
        networkFeeEth: weiToEth(fee),
        totalEth: weiToEth(subtotal - discount + fee),
        coupon: cart.coupon ? { code: cart.coupon, valid: validCoupon } : null,
        canCheckout:
          items.length > 0 &&
          items.every((item) => !item.issue) &&
          (!cart.coupon || validCoupon),
      },
    })
  },
  setItem(
    owner: string,
    input: z.infer<typeof purchaseSelectionSchema>,
    add: boolean,
  ) {
    const cart = get(owner)
    const existing = cart.items.find(
      (item) =>
        item.nftId === input.nftId && item.editionId === input.editionId,
    )
    const quantity = input.quantity + (add ? (existing?.quantity ?? 0) : 0)
    const source = edition(input.nftId, input.editionId)
    if (!source)
      return {
        code: 'NOT_FOUND',
        message: 'NFT ou edição não encontrado.',
        status: 404,
      }
    if (quantity > source.selected.available)
      return {
        code: 'AVAILABILITY_CONFLICT',
        message: `Disponibilidade alterada. Restam ${source.selected.available} unidades desta edição.`,
        status: 409,
      }
    if (!add && !existing)
      return {
        code: 'NOT_FOUND',
        message: 'Este item não está no carrinho.',
        status: 404,
      }
    if (existing) existing.quantity = quantity
    else cart.items.push({ ...input, quantity })
    cart.revision++
    persist()
    return null
  },
  remove(owner: string, nftId: string, editionId: string) {
    const cart = get(owner)
    cart.items = cart.items.filter(
      (item) => item.nftId !== nftId || item.editionId !== editionId,
    )
    cart.revision++
    persist()
  },
  coupon(owner: string, code: string | null) {
    const cart = get(owner)
    cart.coupon = code
    cart.revision++
    persist()
  },
  mergeGuest(guestId: string | null, userId: string) {
    if (!guestId) return
    const guest = state[`guest:${guestId}`]
    if (!guest) return
    const account = get(`user:${userId}`)
    for (const item of guest.items) {
      const existing = account.items.find(
        (saved) =>
          saved.nftId === item.nftId && saved.editionId === item.editionId,
      )
      if (existing) existing.quantity += item.quantity
      else account.items.push({ ...item })
    }
    account.coupon ??= guest.coupon
    account.revision++
    delete state[`guest:${guestId}`]
    persist()
  },
  reset() {
    state = {}
    persist()
  },
}
