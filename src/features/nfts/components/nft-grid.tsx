import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { QueryError } from '@/components/query-feedback'
import { nftListOptions } from '../queries'

export function NftGrid() {
  const query = useQuery(nftListOptions())

  if (query.isPending) {
    return (
      <div role="status" aria-label="Carregando NFTs" className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  if (query.isError) return <QueryError retry={() => { void query.refetch() }} />
  if (query.data.items.length === 0) return <p role="status">Nenhum NFT encontrado.</p>

  return (
    <ul aria-label="NFTs da coleção" className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
      {query.data.items.map((nft) => (
        <li key={nft.id}>
          <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="group block rounded-2xl">
            <div className="aspect-square overflow-hidden rounded-2xl bg-card p-2 sm:p-4">
              <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} width={300} height={300} loading="lazy" className="h-full w-full rounded-xl object-cover" />
            </div>
            <h3 className="mt-3 text-sm group-hover:underline sm:text-base">{nft.name}</h3>
            <p className="mt-1 font-semibold break-all text-primary tabular-nums">{nft.priceEth} ETH</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
