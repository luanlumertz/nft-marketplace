import { queryOptions, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { http } from '@/lib/http'
import { queryClient } from '@/lib/query-client'
import { getSessionToken, saveSessionToken } from '@/lib/credentials'
import {
  anonymousSession,
  authenticationSchema,
  sessionSchema,
  type Session,
} from './contracts'

export const sessionKey = ['session'] as const
export const privateKey = ['private'] as const
export const favoriteKey = (userId: string) =>
  ['private', userId, 'favorites'] as const
export const sessionOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: async ({ signal }) => {
    try {
      return sessionSchema.parse((await http.get('/session', { signal })).data)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401)
        return anonymousSession
      throw error
    }
  },
  staleTime: 15_000,
  retry: false,
})
export function useSession() {
  return useQuery(sessionOptions)
}

export async function clearPrivateData() {
  await queryClient.cancelQueries({ queryKey: privateKey })
  queryClient.removeQueries({ queryKey: privateKey })
}
export async function acceptAuthentication(payload: unknown) {
  const authenticated = authenticationSchema.parse(payload)
  await queryClient.cancelQueries({ queryKey: sessionKey })
  await clearPrivateData()
  saveSessionToken(authenticated.token)
  const session: Session = {
    user: authenticated.user,
    expiresAt: authenticated.expiresAt,
  }
  queryClient.setQueryData(sessionKey, session)
  return authenticated
}
export async function clearSession(expectedToken = getSessionToken()) {
  if (expectedToken !== getSessionToken()) return
  saveSessionToken(null)
  queryClient.setQueryData(sessionKey, anonymousSession)
  await clearPrivateData()
}
export async function logout() {
  const token = getSessionToken()
  try {
    await http.post('/session/logout', undefined, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
  } finally {
    await clearSession(token)
  }
}
