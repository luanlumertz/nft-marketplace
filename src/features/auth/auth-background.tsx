import { defaultParseSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CatalogHome } from '@/features/nfts/components/catalog-home'
import { CatalogPreviewContext } from '@/features/nfts/catalog-context'
import { parseCatalogSearch } from '@/features/nfts/catalog-search'
import { parseDetailSearch } from '@/features/nfts/detail-contracts'
import { nftDetailOptions } from '@/features/nfts/queries'
import {
  NftDetailContent,
  NftDetailSkeleton,
} from '@/features/nfts/components/nft-detail'
import { FavoritesPage } from '@/features/favorites/favorites-page'
import { QueryError } from '@/components/query-feedback'
import { safeReturnTo } from './contracts'
import { CartPage } from '@/features/cart/cart-page'

function originSearch(target: URL) {
  const parsed: Record<string, unknown> = {
    ...defaultParseSearch(target.search),
  }
  for (const key of ['minPrice', 'maxPrice']) {
    const raw = target.searchParams.get(key)
    if (raw !== null && !raw.startsWith('"')) parsed[key] = raw
  }
  return parsed
}
function DetailBackground({ target, id }: { target: URL; id: string }) {
  const query = useQuery(nftDetailOptions(id))
  const search = parseDetailSearch({
    ...parseCatalogSearch(originSearch(target)),
    edition: target.searchParams.get('edition') ?? undefined,
    quantity: Number(target.searchParams.get('quantity') ?? 1),
  })
  if (query.isPending) return <NftDetailSkeleton />
  if (query.isError)
    return (
      <QueryError
        retry={() => {
          void query.refetch()
        }}
      />
    )
  return <NftDetailContent key={id} nft={query.data} search={search} />
}
export function AuthBackground({ redirect }: { redirect: string }) {
  const target = new URL(safeReturnTo(redirect), window.location.origin)
  const detail = target.pathname.match(/^\/nfts\/([^/]+)$/)
  if (detail)
    return (
      <DetailBackground target={target} id={decodeURIComponent(detail[1])} />
    )
  if (target.pathname === '/favoritos') return <FavoritesPage />
  if (target.pathname === '/carrinho') return <CartPage />
  return (
    <CatalogPreviewContext value={parseCatalogSearch(originSearch(target))}>
      <CatalogHome />
    </CatalogPreviewContext>
  )
}
