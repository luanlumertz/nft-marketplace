import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
  getSessionToken,
  isSessionStorageEvent,
  sessionExpiredEvent,
} from '@/lib/credentials'
import { queryClient } from '@/lib/query-client'
import {
  clearPrivateData,
  clearSession,
  sessionKey,
  sessionOptions,
} from './session'
import { safeReturnTo } from './contracts'

export function SessionBoundary() {
  const router = useRouter()
  const session = useQuery({
    ...sessionOptions,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
  useEffect(() => {
    const expire = async (event: Event) => {
      const token = (event as CustomEvent<{ token: string }>).detail?.token
      if (token !== getSessionToken()) return
      const redirect = safeReturnTo(router.state.location.href)
      await clearSession(token)
      if (!/^\/(login|cadastro)(\/|$)/.test(router.state.location.pathname))
        void router.navigate({
          to: '/login',
          search: { redirect, reason: 'expired' },
        })
    }
    const storage = async (event: StorageEvent) => {
      if (!isSessionStorageEvent(event)) return
      await queryClient.cancelQueries({ queryKey: sessionKey })
      await clearPrivateData()
      queryClient.setQueryData(sessionKey, { user: null, expiresAt: null })
      await queryClient.invalidateQueries({ queryKey: sessionKey })
      await router.invalidate()
    }
    window.addEventListener(sessionExpiredEvent, expire)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener(sessionExpiredEvent, expire)
      window.removeEventListener('storage', storage)
    }
  }, [router])
  useEffect(() => {
    const expiresAt = session.data?.expiresAt
    const token = getSessionToken()
    if (!expiresAt || !token) return
    const timer = window.setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent(sessionExpiredEvent, { detail: { token } }),
        ),
      Math.max(0, expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [session.data?.expiresAt])
  return null
}
