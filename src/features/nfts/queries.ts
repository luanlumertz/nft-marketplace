import { queryOptions } from '@tanstack/react-query'
import { http } from '@/lib/http'
import { nftListSchema, nftSchema } from './contracts'
import { detailSchema } from './detail-contracts'
import { z } from 'zod'
import {
  catalogDefaults,
  catalogApiParams,
  type CatalogSearch,
} from './catalog-search'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: ['nfts', 'list'] as const,
  list: (search: CatalogSearch) => ['nfts', 'list', search] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
}

export function nftListOptions(search: CatalogSearch = catalogDefaults) {
  return queryOptions({
    queryKey: nftKeys.list(search),
    queryFn: async ({ signal }) => {
      const response = await http.get<unknown>('/nfts', {
        signal,
        params: catalogApiParams(search),
      })
      return nftListSchema.parse(response.data)
    },
  })
}

export function nftDetailOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => {
      const response = await http.get<unknown>(
        `/nfts/${encodeURIComponent(id)}`,
        { signal },
      )
      return detailSchema.parse(response.data)
    },
  })
}

export function relatedNftsOptions(id: string) {
  return queryOptions({
    queryKey: ['nfts', 'related', id],
    queryFn: async ({ signal }) =>
      z
        .object({ items: z.array(nftSchema) })
        .parse(
          (
            await http.get(`/nfts/${encodeURIComponent(id)}/related`, {
              signal,
            })
          ).data,
        ),
  })
}
