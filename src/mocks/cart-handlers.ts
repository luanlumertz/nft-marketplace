import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { env } from '@/lib/env'
import {
  cartSelectionSchema,
  couponInputSchema,
} from '@/features/cart/contracts'
import { accounts, requestToken } from './accounts'
import { carts, couponError } from './carts'
import { mockStore } from './store'

const base = env.apiUrl.replace(/\/$/, '')
export function cartGuest(request: Request) {
  const guest = request.headers.get('X-Cart-Guest')
  return guest && z.uuid().safeParse(guest).success ? guest : null
}
async function ownerFor(request: Request) {
  const scenario = mockStore.getState().scenario
  await delay(scenario === 'slow' ? 1800 : 120)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'cart-error')
    return HttpResponse.json(
      {
        code: 'TRANSIENT_FAILURE',
        message: 'Não foi possível atualizar o carrinho. Tente novamente.',
      },
      { status: 503 },
    )
  const token = requestToken(request)
  if (token) {
    if (mockStore.getState().scenario === 'session-expired') {
      accounts.revoke(token)
      mockStore.setScenario('default')
    }
    const session = accounts.session(token)
    if (!session)
      return HttpResponse.json(
        { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' },
        { status: 401 },
      )
    return `user:${session.user.id}`
  }
  const guest = cartGuest(request)
  return guest
    ? `guest:${guest}`
    : HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Identificação do carrinho inválida.',
        },
        { status: 422 },
      )
}
async function json(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
export const cartHandlers = [
  http.get(`${base}/cart`, async ({ request }) => {
    const owner = await ownerFor(request)
    return typeof owner === 'string'
      ? HttpResponse.json(carts.snapshot(owner))
      : owner
  }),
  http.post(`${base}/cart/items`, async ({ request }) => {
    const owner = await ownerFor(request)
    if (typeof owner !== 'string') return owner
    const parsed = cartSelectionSchema.safeParse(await json(request))
    if (!parsed.success)
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Confira a edição e a quantidade.',
        },
        { status: 422 },
      )
    const error = carts.setItem(owner, parsed.data, true)
    return error
      ? HttpResponse.json(error, { status: error.status })
      : HttpResponse.json(carts.snapshot(owner), { status: 201 })
  }),
  http.patch(
    `${base}/cart/items/:nftId/:editionId`,
    async ({ request, params }) => {
      const owner = await ownerFor(request)
      if (typeof owner !== 'string') return owner
      const body = await json(request)
      const parsed = cartSelectionSchema.safeParse({
        ...(typeof body === 'object' && body ? body : {}),
        nftId: params.nftId,
        editionId: params.editionId,
      })
      if (!parsed.success)
        return HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Quantidade inválida.' },
          { status: 422 },
        )
      const error = carts.setItem(owner, parsed.data, false)
      return error
        ? HttpResponse.json(error, { status: error.status })
        : HttpResponse.json(carts.snapshot(owner))
    },
  ),
  http.delete(
    `${base}/cart/items/:nftId/:editionId`,
    async ({ request, params }) => {
      const owner = await ownerFor(request)
      if (typeof owner !== 'string') return owner
      carts.remove(owner, String(params.nftId), String(params.editionId))
      return HttpResponse.json(carts.snapshot(owner))
    },
  ),
  http.post(`${base}/cart/quote`, async ({ request }) => {
    const owner = await ownerFor(request)
    if (typeof owner !== 'string') return owner
    const parsed = couponInputSchema.safeParse(await json(request))
    if (!parsed.success)
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Informe um código promocional.' },
        { status: 422 },
      )
    const error = parsed.data.code ? couponError(parsed.data.code) : null
    if (error) return HttpResponse.json(error, { status: 422 })
    carts.coupon(owner, parsed.data.code)
    return HttpResponse.json(carts.snapshot(owner))
  }),
]
