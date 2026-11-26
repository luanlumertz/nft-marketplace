import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { env } from '@/lib/env'
import {
  profileUpdateSchema,
  walletSaveSchema,
  walletSlotSchema,
} from '@/features/account/contracts'
import { accounts, requestToken } from './accounts'
import { mockStore } from './store'

const base = env.apiUrl.replace(/\/$/, '')
async function authorize(request: Request, resource: 'profile' | 'wallets') {
  const scenario = mockStore.getState().scenario
  await delay(scenario === 'slow' ? 1800 : 120)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === `${resource}-error`)
    return HttpResponse.json(
      {
        code: 'TRANSIENT_FAILURE',
        message: 'Não foi possível concluir agora. Tente novamente.',
      },
      { status: 503 },
    )
  const token = requestToken(request)
  if (mockStore.getState().scenario === 'session-expired') {
    accounts.revoke(token)
    mockStore.setScenario('default')
  }
  const current = accounts.session(token)
  return current
    ? { userId: current.user.id, token }
    : HttpResponse.json(
        { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' },
        { status: 401 },
      )
}
async function json(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
function invalid(error: z.ZodError) {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = String(issue.path.at(-1) ?? 'form')
    ;(fields[key] ??= []).push(issue.message)
  }
  return HttpResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Confira os campos destacados.',
      fieldErrors: fields,
    },
    { status: 422 },
  )
}
function storageError() {
  return HttpResponse.json(
    {
      code: 'STORAGE_UNAVAILABLE',
      message:
        'Não foi possível salvar os dados neste navegador. Tente novamente ou use uma imagem menor.',
    },
    { status: 503 },
  )
}
export const collectorHandlers = [
  http.get(`${base}/profile`, async ({ request }) => {
    const authorized = await authorize(request, 'profile')
    if (authorized instanceof Response) return authorized
    try {
      return HttpResponse.json(accounts.profile(authorized.userId))
    } catch {
      return storageError()
    }
  }),
  http.patch(`${base}/profile`, async ({ request }) => {
    const authorized = await authorize(request, 'profile')
    if (authorized instanceof Response) return authorized
    const parsed = profileUpdateSchema.safeParse(await json(request))
    if (!parsed.success) return invalid(parsed.error)
    if (mockStore.getState().scenario === 'profile-conflict')
      return HttpResponse.json(
        {
          code: 'EMAIL_CONFLICT',
          message: 'Este e-mail já está cadastrado.',
          fieldErrors: { email: ['Este e-mail já está cadastrado.'] },
        },
        { status: 409 },
      )
    try {
      const result = await accounts.updateProfile(authorized.token, parsed.data)
      return 'status' in result
        ? HttpResponse.json(result, { status: result.status })
        : HttpResponse.json(result)
    } catch {
      return storageError()
    }
  }),
  http.get(`${base}/wallets`, async ({ request }) => {
    const authorized = await authorize(request, 'wallets')
    return authorized instanceof Response
      ? authorized
      : HttpResponse.json(accounts.wallets(authorized.userId))
  }),
  http.put(`${base}/wallets/:slot`, async ({ request, params }) => {
    const authorized = await authorize(request, 'wallets')
    if (authorized instanceof Response) return authorized
    const slot = walletSlotSchema.safeParse(params.slot)
    if (!slot.success)
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Carteira não encontrada.' },
        { status: 404 },
      )
    const parsed = walletSaveSchema.safeParse(await json(request))
    if (!parsed.success) return invalid(parsed.error)
    if (mockStore.getState().scenario === 'wallet-conflict')
      return HttpResponse.json(
        {
          code: 'WALLET_CONFLICT',
          message:
            'Não foi possível vincular esta carteira. Confira o endereço.',
          fieldErrors: {
            address: ['Não foi possível vincular este endereço.'],
          },
        },
        { status: 409 },
      )
    try {
      if (!accounts.session(authorized.token))
        return HttpResponse.json(
          { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' },
          { status: 401 },
        )
      const result = accounts.saveWallet(
        authorized.userId,
        slot.data,
        parsed.data,
      )
      return 'status' in result
        ? HttpResponse.json(result, { status: result.status })
        : HttpResponse.json(result)
    } catch {
      return storageError()
    }
  }),
  http.delete(`${base}/wallets/:slot`, async ({ request, params }) => {
    const authorized = await authorize(request, 'wallets')
    if (authorized instanceof Response) return authorized
    if (params.slot !== 'secondary')
      return HttpResponse.json(
        {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Somente a carteira secundária pode ser excluída.',
        },
        { status: 405 },
      )
    try {
      return HttpResponse.json(
        accounts.deleteSecondaryWallet(authorized.userId),
      )
    } catch {
      return storageError()
    }
  }),
]
