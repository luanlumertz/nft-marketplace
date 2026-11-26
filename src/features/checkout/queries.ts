import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { http } from '@/lib/http'
import { getSessionToken } from '@/lib/credentials'
import { connectionSchema, orderSchema } from './contracts'

export const orderKeys = {
  all: (userId: string) => ['private', userId, 'orders'] as const,
  detail: (userId: string, id: string) =>
    ['private', userId, 'orders', 'detail', id] as const,
  attempt: (userId: string, id: string) =>
    ['private', userId, 'orders', 'attempt', id] as const,
  checkout: (userId: string) => ['private', userId, 'checkout'] as const,
}
export const privateHeaders = (token = getSessionToken()) => ({
  Authorization: token ? `Bearer ${token}` : '',
})
export function checkoutOptions(userId: string) {
  const headers = privateHeaders()
  return queryOptions({
    queryKey: orderKeys.checkout(userId),
    retry: false,
    queryFn: async ({ signal }) =>
      z
        .object({ connection: connectionSchema.nullable() })
        .parse((await http.get('/checkout', { signal, headers })).data),
  })
}
export function orderOptions(userId: string, id: string) {
  const headers = privateHeaders()
  return queryOptions({
    queryKey: orderKeys.detail(userId, id),
    retry: false,
    queryFn: async ({ signal }) =>
      orderSchema.parse(
        (
          await http.get(`/orders/${encodeURIComponent(id)}`, {
            signal,
            headers,
          })
        ).data,
      ),
  })
}
export function attemptOptions(userId: string, id: string) {
  const headers = privateHeaders()
  return queryOptions({
    queryKey: orderKeys.attempt(userId, id),
    retry: false,
    queryFn: async ({ signal }) =>
      z.object({ order: orderSchema.nullable() }).parse(
        (
          await http.get('/orders', {
            params: { attempt: id },
            signal,
            headers,
          })
        ).data,
      ),
  })
}
