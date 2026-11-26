import { readJson } from './http-utils'
import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  ethAmountSchema,
  nftUpdatedSchema,
  type NftUpdated,
} from '@/features/nfts/contracts'
import { env } from '@/lib/env'
import { mockStore, scenarioSchema } from './store'
import {
  broadcastNftUpdated,
  socketHandler,
  subscriberCount,
  orderSubscriberCount,
  setOrdersOnline,
} from './socket'
import { checkoutHandlers } from './checkout-handlers'
import { orders } from './orders'
import { parseCatalogSearch } from '@/features/nfts/catalog-search'
import { queryCatalog } from './catalog'
import { accounts } from './accounts'
import { accountHandlers } from './account-handlers'
import { cartHandlers } from './cart-handlers'
import { collectorHandlers } from './collector-handlers'
import { carts } from './carts'
import { detailFor, relatedFor } from './nft-details'

const base = env.apiUrl.replace(/\/$/, '')
const nftPatchSchema = z
  .object({
    priceEth: ethAmountSchema.optional(),
    available: z.number().int().nonnegative().optional(),
  })
  .refine(
    (patch) => patch.priceEth !== undefined || patch.available !== undefined,
  )

async function simulateNetwork() {
  const { scenario } = mockStore.getState()
  await delay(scenario === 'slow' ? 1800 : 120)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'catalog-error')
    return HttpResponse.json(
      {
        code: 'TRANSIENT_FAILURE',
        message: 'Catálogo temporariamente indisponível.',
      },
      { status: 503 },
    )
}

export const handlers = [
  ...accountHandlers,
  ...cartHandlers,
  ...collectorHandlers,
  ...checkoutHandlers,
  http.get(`${base}/nfts/:id/related`, async ({ params }) => {
    const error = await simulateNetwork()
    if (error) return error
    const nft = mockStore.getState().nfts.find((item) => item.id === params.id)
    return nft
      ? HttpResponse.json({ items: relatedFor(nft, mockStore.getState().nfts) })
      : HttpResponse.json(
          { code: 'NOT_FOUND', message: 'NFT não encontrado.' },
          { status: 404 },
        )
  }),
  http.get(`${base}/nfts`, async ({ request }) => {
    const search = parseCatalogSearch(
      Object.fromEntries(new URL(request.url).searchParams),
    )
    const { scenario, nfts } = mockStore.getState()
    const result = queryCatalog(
      scenario === 'empty' ? [] : structuredClone(nfts),
      search,
    )
    if (scenario === 'network-error') return HttpResponse.error()
    if (scenario === 'out-of-order')
      await delay(search.q.length <= 3 ? 1400 : 80)
    const error = await simulateNetwork()
    if (error) return error
    return HttpResponse.json(result)
  }),
  http.get(`${base}/nfts/:id`, async ({ params }) => {
    const error = await simulateNetwork()
    if (error) return error
    const nft = mockStore.getState().nfts.find((item) => item.id === params.id)
    return nft
      ? HttpResponse.json(detailFor(nft))
      : HttpResponse.json(
          { code: 'NOT_FOUND', message: 'NFT não encontrado.' },
          { status: 404 },
        )
  }),

  // Controles exclusivos do ambiente MSW: nunca sao importados pela interface.
  http.post(`${base}/__mock/reset`, () => {
    mockStore.reset()
    accounts.reset()
    carts.reset()
    orders.resetTimers()
    setOrdersOnline(true)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(`${base}/__mock/state`, () =>
    HttpResponse.json({
      scenario: mockStore.getState().scenario,
      subscribers: subscriberCount(),
      orderSubscribers: orderSubscriberCount(),
    }),
  ),
  http.post(`${base}/__mock/scenario`, async ({ request }) => {
    const parsed = scenarioSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 422 })
    mockStore.setScenario(parsed.data)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${base}/__mock/nfts/:id`, async ({ request, params }) => {
    const parsed = nftPatchSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 422 })
    const current = mockStore
      .getState()
      .nfts.find((item) => item.id === params.id)
    if (!current)
      return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
    const updated = { ...current, ...parsed.data, version: current.version + 1 }
    mockStore.updateNft(updated)
    const event: NftUpdated = {
      eventId: crypto.randomUUID(),
      resourceId: updated.id,
      version: updated.version,
      data: updated,
    }
    broadcastNftUpdated(event)
    return HttpResponse.json(event)
  }),
  http.post(`${base}/__mock/events`, async ({ request }) => {
    const parsed = nftUpdatedSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 422 })
    mockStore.updateNft(parsed.data.data)
    broadcastNftUpdated(parsed.data)
    return new HttpResponse(null, { status: 204 })
  }),
  socketHandler,
]
