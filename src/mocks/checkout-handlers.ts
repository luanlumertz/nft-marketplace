import { readJson } from './http-utils'
import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { env } from '@/lib/env'
import {
  connectionInputSchema,
  orderInputSchema,
  orderUpdatedSchema,
} from '@/features/checkout/contracts'
import { accounts, requestToken } from './accounts'
import { mockStore } from './store'
import { CheckoutFailure, orders } from './orders'
import {
  broadcastNftUpdated,
  broadcastOrderUpdated,
  setOrdersOnline,
} from './socket'
import { carts } from './carts'

const base = env.apiUrl.replace(/\/$/, '')
async function authorize(request: Request) {
  const scenario = mockStore.getState().scenario
  await delay(scenario === 'slow' ? 1800 : 120)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'checkout-error')
    return HttpResponse.json(
      {
        code: 'TRANSIENT_FAILURE',
        message: 'Não foi possível carregar o pagamento. Tente novamente.',
      },
      { status: 503 },
    )
  const token = requestToken(request)
  if (mockStore.getState().scenario === 'session-expired') {
    accounts.revoke(token)
    mockStore.setScenario('default')
  }
  const session = accounts.session(token)
  return session
    ? { userId: session.user.id, token }
    : HttpResponse.json(
        { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' },
        { status: 401 },
      )
}
function failure(error: unknown) {
  return error instanceof CheckoutFailure
    ? HttpResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      )
    : HttpResponse.json(
        {
          code: 'STORAGE_UNAVAILABLE',
          message: 'Não foi possível salvar esta operação. Tente novamente.',
        },
        { status: 503 },
      )
}
function invalid(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path.at(-1) ?? 'form')] ??= []).push(
      issue.message,
    )
  return HttpResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Confira os campos destacados.',
      fieldErrors,
    },
    { status: 422 },
  )
}
export const checkoutHandlers = [
  http.get(`${base}/checkout`, async ({ request }) => {
    const auth = await authorize(request)
    if (auth instanceof Response) return auth
    try {
      return HttpResponse.json({
        connection: orders.connection(auth.userId, auth.token),
      })
    } catch (error) {
      return failure(error)
    }
  }),
  http.post(`${base}/wallet-connections`, async ({ request }) => {
    const auth = await authorize(request)
    if (auth instanceof Response) return auth
    const parsed = connectionInputSchema.safeParse(await readJson(request))
    if (!parsed.success) return invalid(parsed.error)
    if (!accounts.session(auth.token))
      return HttpResponse.json(
        { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' },
        { status: 401 },
      )
    try {
      return HttpResponse.json(
        orders.connect(auth.userId, auth.token, parsed.data),
        { status: 201 },
      )
    } catch (error) {
      return failure(error)
    }
  }),
  http.delete(`${base}/wallet-connections/:id`, async ({ request, params }) => {
    const auth = await authorize(request)
    if (auth instanceof Response) return auth
    try {
      orders.disconnect(auth.userId, String(params.id))
      return new HttpResponse(null, { status: 204 })
    } catch (error) {
      return failure(error)
    }
  }),
  http.post(`${base}/orders`, async ({ request }) => {
    const auth = await authorize(request)
    if (auth instanceof Response) return auth
    const parsed = orderInputSchema.safeParse(await readJson(request))
    if (!parsed.success) return invalid(parsed.error)
    const key = z.uuid().safeParse(request.headers.get('Idempotency-Key'))
    if (!key.success)
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Identificação da tentativa inválida.',
        },
        { status: 422 },
      )
    const scenario = mockStore.getState().scenario
    if (scenario === 'order-error')
      return HttpResponse.json(
        {
          code: 'TRANSIENT_FAILURE',
          message:
            'Não foi possível enviar o pedido. Recupere a tentativa para continuar.',
        },
        { status: 503 },
      )
    if (!accounts.session(auth.token))
      return HttpResponse.json(
        { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' },
        { status: 401 },
      )
    if (scenario === 'price-changed' || scenario === 'edition-sold-out') {
      const first = carts.snapshot(`user:${auth.userId}`).items[0]
      const nft = mockStore
        .getState()
        .nfts.find((nft) => nft.id === first?.nftId)
      if (nft) {
        const updated = {
          ...nft,
          ...(scenario === 'price-changed'
            ? { priceEth: '2.15' }
            : { available: 0 }),
          version: nft.version + 1,
        }
        mockStore.updateNft(updated)
        broadcastNftUpdated({
          eventId: crypto.randomUUID(),
          resourceId: nft.id,
          version: updated.version,
          data: updated,
        })
      }
      mockStore.setScenario('default')
    }
    try {
      const order = orders.create(
        auth.userId,
        auth.token,
        key.data,
        parsed.data,
      )
      if (scenario === 'order-timeout') await delay(6500)
      return HttpResponse.json(order, { status: 201 })
    } catch (error) {
      return failure(error)
    }
  }),
  http.get(`${base}/orders`, async ({ request }) => {
    const auth = await authorize(request)
    if (auth instanceof Response) return auth
    const attempt = z
      .uuid()
      .safeParse(new URL(request.url).searchParams.get('attempt'))
    if (!attempt.success)
      return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 422 })
    try {
      return HttpResponse.json({
        order: orders.attempt(auth.userId, attempt.data),
      })
    } catch (error) {
      return failure(error)
    }
  }),
  http.get(`${base}/orders/:id`, async ({ request, params }) => {
    const auth = await authorize(request)
    if (auth instanceof Response) return auth
    try {
      const order = orders.find(auth.userId, String(params.id))
      return order
        ? HttpResponse.json(order)
        : HttpResponse.json(
            {
              code: 'NOT_FOUND',
              message: 'Pedido não encontrado para esta conta.',
            },
            { status: 404 },
          )
    } catch (error) {
      return failure(error)
    }
  }),
  http.post(`${base}/__mock/orders/:id/settle`, async ({ params, request }) => {
    const result = z
      .enum(['confirmed', 'declined'])
      .safeParse(await readJson(request))
    if (!result.success) return invalid(result.error)
    try {
      const order = orders.settle(String(params.id), result.data)
      return order
        ? HttpResponse.json(order)
        : new HttpResponse(null, { status: 404 })
    } catch (error) {
      return failure(error)
    }
  }),
  http.post(`${base}/__mock/order-events`, async ({ request }) => {
    const parsed = orderUpdatedSchema.safeParse(await readJson(request))
    if (!parsed.success) return invalid(parsed.error)
    broadcastOrderUpdated(parsed.data)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${base}/__mock/orders-online`, async ({ request }) => {
    const parsed = z.boolean().safeParse(await readJson(request))
    if (!parsed.success) return invalid(parsed.error)
    setOrdersOnline(parsed.data)
    return new HttpResponse(null, { status: 204 })
  }),
]
