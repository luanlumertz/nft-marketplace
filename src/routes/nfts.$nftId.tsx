import {
  createFileRoute,
  Link,
  stripSearchParams,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { nftDetailOptions } from '@/features/nfts/queries'
import { validateDetailSearch } from '@/features/nfts/detail-contracts'
import {
  parseCatalogSearch,
  catalogDefaults,
} from '@/features/nfts/catalog-search'
import {
  NftDetailContent,
  NftDetailSkeleton,
} from '@/features/nfts/components/nft-detail'
import { QueryError } from '@/components/query-feedback'

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: validateDetailSearch,
  search: {
    middlewares: [
      stripSearchParams({
        ...catalogDefaults,
        edition: undefined,
        quantity: 1,
      }),
    ],
  },
  component: NftDetailPage,
})
function NftDetailPage() {
  const { nftId } = Route.useParams(),
    search = Route.useSearch()
  const query = useQuery(nftDetailOptions(nftId))
  if (query.isPending) return <NftDetailSkeleton />
  if (
    query.isError &&
    isAxiosError(query.error) &&
    query.error.response?.status === 404
  )
    return (
      <section className="space-y-5 mobile:p-6">
        <h1 className="text-3xl font-bold">NFT não encontrado</h1>
        <Link
          to="/"
          search={parseCatalogSearch(search)}
          hash="catalogo"
          className="text-primary underline"
        >
          Voltar à coleção
        </Link>
      </section>
    )
  if (query.isError)
    return (
      <QueryError
        retry={() => {
          void query.refetch()
        }}
      />
    )
  return <NftDetailContent key={nftId} nft={query.data} search={search} />
}
