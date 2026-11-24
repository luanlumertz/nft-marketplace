import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { nftDetailOptions } from '@/features/nfts/queries'
import { QueryError } from '@/components/query-feedback'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/nfts/$nftId')({ component: NftDetailPage })

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const query = useQuery(nftDetailOptions(nftId))

  if (query.isPending) return (
    <div role="status" aria-label="Carregando NFT" className="grid gap-8 md:grid-cols-2">
      <Skeleton className="aspect-square rounded-3xl" />
      <div className="space-y-5"><Skeleton className="h-10 w-4/5" /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-28 w-full" /></div>
    </div>
  )
  if (query.isError && isAxiosError(query.error) && query.error.response?.status === 404) return (
    <section className="space-y-5">
      <h1 className="text-3xl font-bold">NFT não encontrado</h1>
      <Link to="/" className="text-primary underline">Voltar à coleção</Link>
    </section>
  )
  if (query.isError) return <QueryError retry={() => { void query.refetch() }} />

  const nft = query.data
  return (
    <>
      <Link to="/" className="mb-8 inline-block text-sm text-primary underline">Voltar à coleção</Link>
      <article className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
        <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} width={500} height={500} className="aspect-square w-full rounded-3xl bg-card object-cover" />
        <div>
          <h1 className="text-3xl leading-snug font-bold">{nft.name}</h1>
          <p className="mt-4 text-2xl font-semibold break-all text-primary tabular-nums">{nft.priceEth} ETH</p>
          <p className="mt-6 text-sm leading-7 text-muted-foreground">{nft.description}</p>
          <dl className="mt-8 space-y-4 text-sm">
            <div><dt className="font-semibold">Edição</dt><dd className="mt-1 text-muted-foreground">{nft.edition}</dd></div>
            <div><dt className="font-semibold">Rede</dt><dd className="mt-1 text-muted-foreground capitalize">{nft.network}</dd></div>
            <div><dt className="font-semibold">Disponibilidade</dt><dd className="mt-1 text-muted-foreground">{nft.available === 0 ? 'Edição esgotada' : `${nft.available} unidades disponíveis`}</dd></div>
          </dl>
        </div>
      </article>
    </>
  )
}
