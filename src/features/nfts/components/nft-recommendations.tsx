import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { CarouselDots } from '@/components/carousel-dots'
import { catalogDefaults, parseCatalogSearch } from '../catalog-search'
import { relatedNftsOptions } from '../queries'

export function NftRecommendations({
  id,
  search = catalogDefaults,
  title = 'Mais desta coleção',
}: {
  id: string
  search?: ReturnType<typeof parseCatalogSearch>
  title?: string
}) {
  const query = useQuery(relatedNftsOptions(id)),
    [page, setPage] = useState(0)
  const pages = Math.ceil((query.data?.items.length ?? 0) / 5)
  return (
    <section className="mt-24 mobile:hidden" aria-labelledby="related-title">
      <h2
        id="related-title"
        className="border-b border-border pb-2 text-[18px] font-semibold text-primary"
      >
        {title}
      </h2>
      {query.isPending ? (
        <div className="mt-8 grid grid-cols-5 gap-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : query.isError ? (
        <p role="alert" className="mt-6 text-sm text-muted-foreground">
          Não foi possível carregar os itens relacionados.{' '}
          <button
            className="text-primary underline"
            onClick={() => {
              void query.refetch()
            }}
          >
            Tentar novamente
          </button>
        </p>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-5 gap-6 tablet:gap-3">
            {query.data?.items.slice(page * 5, page * 5 + 5).map((item) => (
              <li key={item.id}>
                <Link
                  to="/nfts/$nftId"
                  params={{ nftId: item.id }}
                  search={parseCatalogSearch(search)}
                  className="block"
                >
                  <div className="flex aspect-219/256 items-center overflow-hidden rounded-[12px] bg-card p-3">
                    <img
                      src={item.imageUrl}
                      alt={`Arte de ${item.name}`}
                      width={219}
                      height={256}
                      loading="lazy"
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  </div>
                  <h3 className="mt-3 text-sm">{item.name}</h3>
                  <p className="text-[18px] font-semibold text-primary">
                    {item.priceEth} ETH
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <CarouselDots
              count={pages}
              active={page}
              onSelect={setPage}
              label="Páginas de itens relacionados"
              buttonLabel="Relacionados, página"
              className="mt-6"
            />
          )}
        </>
      )}
    </section>
  )
}
