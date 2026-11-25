import axios from 'axios'
import { env } from '@/lib/env'
import { getSessionToken, sessionExpiredEvent } from './credentials'

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token && !config.headers.has('Authorization'))
    config.headers.set('Authorization', `Bearer ${token}`)
  return config
})
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const token = getSessionToken()
      if (
        token &&
        error.config?.headers.get('Authorization') === `Bearer ${token}`
      )
        window.dispatchEvent(
          new CustomEvent(sessionExpiredEvent, { detail: { token } }),
        )
    }
    return Promise.reject(error)
  },
)
