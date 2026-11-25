import { queryOptions } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { nftListSchema, nftSchema } from './contracts'

export const nftKeys = {
  all: ['nfts'] as const,
  list: () => ['nfts', 'list'] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
}

export function nftListOptions() {
  return queryOptions({
    queryKey: nftKeys.list(),
    queryFn: async ({ signal }) => {
      const response = await http.get<unknown>('/nfts', { signal })
      return nftListSchema.parse(response.data)
    },
  })
}

export function nftDetailOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => {
      const response = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, { signal })
      return nftSchema.parse(response.data)
    },
  })
}
