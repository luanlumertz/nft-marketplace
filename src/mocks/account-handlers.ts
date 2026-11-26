import { readJson } from './http-utils'
import { delay, http, HttpResponse } from 'msw'
import { env } from '@/lib/env'
import { loginSchema, registerSchema } from '@/features/auth/contracts'
import { accounts, requestToken } from './accounts'
import { mockStore } from './store'
import { carts } from './carts'
import { cartGuest } from './cart-handlers'

const base = env.apiUrl.replace(/\/$/, '')
const expired = () =>
  HttpResponse.json(
    {
      code: 'SESSION_EXPIRED',
      message: 'Sua sessão expirou. Entre novamente.',
    },
    { status: 401 },
  )
async function network() {
  const scenario = mockStore.getState().scenario
  await delay(scenario === 'slow' ? 1800 : 120)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'auth-error')
    return HttpResponse.json(
      {
        code: 'TRANSIENT_FAILURE',
        message: 'Não foi possível concluir agora. Tente novamente.',
      },
      { status: 503 },
    )
}
function session(request: Request) {
  if (mockStore.getState().scenario === 'session-expired') {
    accounts.revoke(requestToken(request))
    mockStore.setScenario('default')
  }
  return accounts.session(requestToken(request))
}
export const accountHandlers = [
  http.get(`${base}/session`, async ({ request }) => {
    const error = await network()
    if (error) return error
    if (!requestToken(request))
      return HttpResponse.json({ user: null, expiresAt: null })
    const current = session(request)
    return current ? HttpResponse.json(current) : expired()
  }),
  http.post(`${base}/session/login`, async ({ request }) => {
    const error = await network()
    if (error) return error
    const parsed = loginSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Confira os campos.',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      )
    const user = await accounts.login(parsed.data.email, parsed.data.password)
    if (user) {
      accounts.revoke(requestToken(request))
      carts.mergeGuest(cartGuest(request), user.id)
      return HttpResponse.json(accounts.authenticate(user))
    }
    return HttpResponse.json(
      { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' },
      { status: 400 },
    )
  }),
  http.post(`${base}/session/register`, async ({ request }) => {
    const error = await network()
    if (error) return error
    const parsed = registerSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Confira os campos.',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      )
    const user =
      mockStore.getState().scenario === 'registration-conflict'
        ? null
        : await accounts.register(parsed.data)
    if (user) {
      accounts.revoke(requestToken(request))
      carts.mergeGuest(cartGuest(request), user.id)
      return HttpResponse.json(accounts.authenticate(user), { status: 201 })
    }
    return HttpResponse.json(
      {
        code: 'EMAIL_CONFLICT',
        message: 'Este e-mail já está cadastrado.',
        fieldErrors: { email: ['Este e-mail já está cadastrado.'] },
      },
      { status: 409 },
    )
  }),
  http.post(`${base}/session/logout`, async ({ request }) => {
    const error = await network()
    if (error) return error
    accounts.revoke(requestToken(request))
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(`${base}/favorites`, async ({ request }) => {
    const error = await network()
    if (error) return error
    const current = session(request)
    return current
      ? HttpResponse.json({ ids: accounts.favorites(current.user.id) })
      : expired()
  }),
  ...(['put', 'delete'] as const).map((method) =>
    http[method](`${base}/favorites/:id`, async ({ request, params }) => {
      const error = await network()
      if (error) return error
      const current = session(request)
      if (!current) return expired()
      const id = String(params.id)
      if (!mockStore.getState().nfts.some((nft) => nft.id === id))
        return HttpResponse.json(
          { code: 'NOT_FOUND', message: 'NFT não encontrado.' },
          { status: 404 },
        )
      if (mockStore.getState().scenario === 'favorite-error')
        return HttpResponse.json(
          {
            code: 'FAVORITE_FAILURE',
            message: 'Não foi possível atualizar o favorito. Tente novamente.',
          },
          { status: 503 },
        )
      return HttpResponse.json({
        ids: accounts.favorite(current.user.id, id, method === 'put'),
      })
    }),
  ),
  http.post(`${base}/__mock/session/expire`, () => {
    accounts.expireAll()
    return new HttpResponse(null, { status: 204 })
  }),
]
