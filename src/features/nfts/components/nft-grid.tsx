import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { QueryError } from '@/components/query-feedback'
import { nftListOptions } from '../queries'
import {
  catalogDefaults,
  collections,
  networks,
  sortOptions,
  tabs,
  type CatalogSearch,
} from '../catalog-search'
import { useCatalogNavigation } from '../use-catalog-navigation'
import { CatalogFilters, FilterDrawer } from './catalog-controls'

export function NftGrid() {
  const { search, update, navigate } = useCatalogNavigation()
  const query = useQuery(nftListOptions(search))
  const data = query.data
  useEffect(() => {
    if (data && data.page !== search.page) {
      void navigate({
        search: { ...search, page: data.page },
        replace: true,
        resetScroll: false,
      })
    }
  }, [data, search, navigate])
  const active =
    !!search.q ||
    search.collections.length > 0 ||
    search.networks.length > 0 ||
    search.minPrice !== '0' ||
    search.maxPrice !== '12.3'
  const filters = { search, update, facets: data?.facets }

  return (
    <section
      id="catalogo"
      className="catalog-layout"
      aria-labelledby="titulo-colecao"
    >
      <h2 id="titulo-colecao" className="sr-only">
        Catálogo de NFTs
      </h2>
      <aside className="catalog-sidebar" aria-label="Filtros do catálogo">
        <CatalogFilters {...filters} />
        {data?.featured[1] && (
          <Link
            className="featured-nft"
            to="/nfts/$nftId"
            params={{ nftId: data.featured[1].id }}
            search={search}
          >
            <h3>NFT em destaque</h3>
            <strong>Oferta limitada</strong>
            <img
              src={data.featured[1].imageUrl}
              alt={`Arte de ${data.featured[1].name}`}
              width={310}
              height={365}
              loading="lazy"
            />
          </Link>
        )}
      </aside>
      <div className="catalog-main">
        <div className="catalog-toolbar">
          <div
            role="tablist"
            aria-label="Seleção de NFTs"
            className="catalog-tabs"
          >
            {tabs.map(([value, label], index) => (
              <button
                key={value}
                role="tab"
                id={`tab-${value}`}
                tabIndex={search.tab === value ? 0 : -1}
                aria-selected={search.tab === value}
                aria-controls="catalog-panel"
                onClick={() => update({ tab: value })}
                onKeyDown={(event) => {
                  if (
                    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                      event.key,
                    )
                  )
                    return
                  event.preventDefault()
                  const target =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? tabs.length - 1
                        : (index +
                            (event.key === 'ArrowRight' ? 1 : -1) +
                            tabs.length) %
                          tabs.length
                  document.getElementById(`tab-${tabs[target][0]}`)?.focus()
                  update({ tab: tabs[target][0] })
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="catalog-sort">
            Ordenar por:
            <select
              aria-label="Ordenar NFTs"
              value={search.sort}
              onChange={(e) =>
                update({ sort: e.target.value as CatalogSearch['sort'] })
              }
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="tablet-filter">
            <FilterDrawer {...filters} />
          </div>
        </div>
        {active && (
          <div className="active-filters" aria-label="Filtros aplicados">
            {search.q && (
              <button onClick={() => update({ q: '' })}>
                Busca: {search.q}
                <X size={13} />
              </button>
            )}
            {search.collections.map((value) => (
              <button
                key={value}
                onClick={() =>
                  update({
                    collections: search.collections.filter(
                      (item) => item !== value,
                    ),
                  })
                }
              >
                {collections.find(([key]) => key === value)?.[1]}
                <X size={13} />
              </button>
            ))}
            {search.networks.map((value) => (
              <button
                key={value}
                onClick={() =>
                  update({
                    networks: search.networks.filter((item) => item !== value),
                  })
                }
              >
                {networks.find(([key]) => key === value)?.[1]}
                <X size={13} />
              </button>
            ))}
            {(search.minPrice !== '0' || search.maxPrice !== '12.3') && (
              <button
                onClick={() => update({ minPrice: '0', maxPrice: '12.3' })}
              >
                {search.minPrice} – {search.maxPrice} ETH
                <X size={13} />
              </button>
            )}
            <button onClick={() => update(catalogDefaults)}>Limpar tudo</button>
          </div>
        )}
        <div
          role="status"
          aria-live="polite"
          className={
            active || query.isRefetching ? 'catalog-result-count' : 'sr-only'
          }
        >
          {query.isRefetching
            ? 'Atualizando catálogo…'
            : data
              ? `${data.total} NFTs encontrados. Página ${data.page} de ${data.totalPages}.`
              : ''}
        </div>
        <div
          id="catalog-panel"
          role="tabpanel"
          aria-labelledby={`tab-${search.tab}`}
          aria-busy={query.isFetching}
        >
          {query.isPending ? (
            <div
              role="status"
              aria-label="Carregando NFTs"
              className="nft-grid"
            >
              {Array.from({ length: 9 }, (_, index) => (
                <div className="nft-card" key={index}>
                  <Skeleton className="card-art" />
                  <Skeleton className="mt-3 h-6 w-4/5" />
                  <Skeleton className="mt-2 h-5 w-1/2" />
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <QueryError
              retry={() => {
                void query.refetch()
              }}
            />
          ) : data?.items.length === 0 ? (
            <div className="empty-catalog">
              <h3>Nenhum NFT encontrado.</h3>
              <p>Tente outra busca ou remova alguns filtros.</p>
              <button onClick={() => update(catalogDefaults)}>
                Limpar filtros e explorar
              </button>
            </div>
          ) : (
            <ul aria-label="NFTs da coleção" className="nft-grid">
              {data?.items.map((nft, index) => (
                <li key={nft.id} className="nft-card">
                  <Link
                    to="/nfts/$nftId"
                    params={{ nftId: nft.id }}
                    search={search}
                    className="nft-card-link"
                  >
                    <div className="card-art">
                      <img
                        src={nft.imageUrl}
                        alt={`Arte de ${nft.name}`}
                        width={300}
                        height={300}
                        loading="lazy"
                      />
                      {nft.rare && <span className="rarity-label">Raro</span>}
                    </div>
                    <h3>{nft.name}</h3>
                    <p className="nft-price">
                      {nft.priceEth} ETH{' '}
                      {nft.previousPriceEth && (
                        <del>{nft.previousPriceEth} ETH</del>
                      )}
                    </p>
                    {nft.available === 0 && (
                      <span className="sold-out-label">Edição esgotada</span>
                    )}
                  </Link>
                  {index === 0 && (
                    <button
                      className="card-favorite"
                      disabled
                      aria-label="Favoritos indisponíveis nesta demonstração"
                      title="Favoritos indisponíveis nesta demonstração"
                    >
                      <Heart size={17} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {data && data.totalPages > 1 && (
          <nav
            className="catalog-pagination"
            aria-label="Paginação do catálogo"
          >
            {data.page > 1 && (
              <button
                aria-label="Página anterior"
                onClick={() => update({ page: data.page - 1 })}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {Array.from(
              { length: data.totalPages },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                key={page}
                aria-label={`Página ${page}`}
                aria-current={data.page === page ? 'page' : undefined}
                onClick={() => update({ page })}
              >
                {page}
              </button>
            ))}
            {data.page < data.totalPages && (
              <button
                aria-label="Próxima página"
                onClick={() => update({ page: data.page + 1 })}
              >
                <ChevronRight size={18} />
              </button>
            )}
          </nav>
        )}
      </div>
    </section>
  )
}
