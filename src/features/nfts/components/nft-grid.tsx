import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { FavoriteButton } from '@/features/favorites/favorite-button'
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
  const { search, update, navigate, isPreview } = useCatalogNavigation()
  const query = useQuery(nftListOptions(search))
  const data = query.data
  useEffect(() => {
    if (!isPreview && data && data.page !== search.page) {
      void navigate({
        search: { ...search, page: data.page },
        replace: true,
        resetScroll: false,
      })
    }
  }, [data, search, navigate, isPreview])
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
      className="catalog-layout grid grid-cols-[310px_minmax(0,1fr)] gap-12 scroll-mt-6 tablet:grid-cols-[240px_minmax(0,1fr)] tablet:gap-6 tablet-compact:block mobile:block"
      aria-labelledby="titulo-colecao"
    >
      <h2 id="titulo-colecao" className="sr-only">
        Catálogo de NFTs
      </h2>
      <aside
        className="catalog-sidebar tablet-compact:hidden mobile:hidden"
        aria-label="Filtros do catálogo"
      >
        <CatalogFilters {...filters} />
        {data?.featured[1] && (
          <Link
            className="featured-nft block relative mt-6 overflow-hidden [background:radial-gradient(ellipse_at_top,#47301c,var(--background)_70%)] [&_h3]:m-[24px_20px_10px] [&_h3]:text-primary [&_h3]:text-[24px] [&_h3]:font-bold [&_h3]:uppercase [&_>_strong]:block [&_>_strong]:text-center [&_>_strong]:uppercase [&_>_strong]:text-[23px] [&_>_strong]:mb-2 [&_img]:w-full [&_img]:h-91.25 [&_img]:object-cover [&_img]:rounded-3xl"
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
      <div className="catalog-main min-w-0">
        <div className="catalog-toolbar min-h-7 flex items-start justify-between gap-3.5 mb-5.5 mobile:mb-4 mobile:min-h-6">
          <div
            role="tablist"
            aria-label="Seleção de NFTs"
            className="catalog-tabs flex justify-start gap-5.5 whitespace-nowrap [&_button]:[border-bottom:2px_solid_transparent] [&_button]:text-[16px] [&_button]:pb-1 [&_button]:min-h-7 [&_button[aria-selected='true']]:text-primary [&_button[aria-selected='true']]:border-b-primary tablet:gap-3 tablet:[&_button]:text-[14px] mobile:flex-wrap mobile:gap-x-4 mobile:gap-y-2 mobile:w-full mobile:[&_button]:text-[14px] mobile:[&_button]:min-h-6"
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
          <label className="catalog-sort flex items-center gap-1 whitespace-nowrap text-[14px] mt-px [&_select]:bg-background [&_select]:max-w-48 [&_select]:cursor-pointer tablet:text-[13px] tablet:[&_select]:max-w-40 tablet-compact:ml-auto mobile:hidden">
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
          <div className="tablet-filter hidden tablet-compact:block tablet-compact:[&_.filter-trigger]:h-8 tablet-compact:[&_.filter-trigger]:w-9 tablet-compact:[&_.filter-trigger]:rounded-md mobile:hidden">
            <FilterDrawer {...filters} />
          </div>
        </div>
        {active && (
          <div
            className="active-filters flex flex-wrap gap-2 mb-5 [&_button]:flex [&_button]:max-w-full [&_button]:items-center [&_button]:gap-1.75 [&_button]:[border:1px_solid_var(--border)] [&_button]:rounded-[18px] [&_button]:p-[5px_10px] [&_button]:text-[12px] [&_button]:text-muted-foreground [&_button]:wrap-anywhere"
            aria-label="Filtros aplicados"
          >
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
            active || query.isRefetching
              ? 'catalog-result-count mb-3.75 text-muted-foreground text-[12px]'
              : 'sr-only'
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
              className="nft-grid grid grid-cols-3 gap-x-8.5 gap-y-16 tablet:gap-x-5 tablet:gap-y-10 mobile:grid-cols-2 mobile:gap-x-6 mobile:gap-y-5"
            >
              {Array.from({ length: 9 }, (_, index) => (
                <div
                  className="nft-card min-w-0 relative [&_h3]:text-[15px] [&_h3]:mt-2.5 [&_h3]:leading-6 tablet:[&_h3]:text-[13px] mobile:even:mt-8 mobile:even:-mb-8 mobile:[&_h3]:text-[13px] mobile:[&_h3]:leading-5 mobile:[&_h3]:m-[10px_7px_0]"
                  key={index}
                >
                  <Skeleton className="card-art relative flex items-center bg-card aspect-258/300 w-full p-[24px_12px] rounded-[12px] overflow-hidden [&_img]:block [&_img]:w-full [&_img]:h-auto [&_img]:aspect-[1] [&_img]:object-cover [&_img]:rounded-2xl tablet:py-3.5 mobile:aspect-175/200 mobile:p-[12px_9px_18px] mobile:rounded-[28px] mobile:[&_img]:rounded-2xl" />
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
            <div className="empty-catalog min-h-75 flex flex-col items-start justify-center gap-3 [&_h3]:text-[20px] [&_h3]:font-semibold [&_p]:text-[14px] [&_p]:text-muted-foreground [&_button]:text-primary [&_button]:underline [&_button]:underline-offset-4 mobile:min-h-57.5">
              <h3>Nenhum NFT encontrado.</h3>
              <p>Tente outra busca ou remova alguns filtros.</p>
              <button onClick={() => update(catalogDefaults)}>
                Limpar filtros e explorar
              </button>
            </div>
          ) : (
            <ul
              aria-label="NFTs da coleção"
              className="nft-grid grid grid-cols-3 gap-x-8.5 gap-y-16 tablet:gap-x-5 tablet:gap-y-10 mobile:grid-cols-2 mobile:gap-x-6 mobile:gap-y-5"
            >
              {data?.items.map((nft, index) => (
                <li
                  key={nft.id}
                  className="nft-card min-w-0 relative [&_h3]:text-[15px] [&_h3]:mt-2.5 [&_h3]:leading-6 tablet:[&_h3]:text-[13px] mobile:even:mt-8 mobile:even:-mb-8 mobile:[&_h3]:text-[13px] mobile:[&_h3]:leading-5 mobile:[&_h3]:m-[10px_7px_0]"
                >
                  <Link
                    to="/nfts/$nftId"
                    params={{ nftId: nft.id }}
                    search={search}
                    className="nft-card-link block [&:hover_h3]:underline [&:hover_h3]:underline-offset-4"
                  >
                    <div className="card-art relative flex items-center bg-card aspect-258/300 w-full p-[24px_12px] rounded-[12px] overflow-hidden [&_img]:block [&_img]:w-full [&_img]:h-auto [&_img]:aspect-[1] [&_img]:object-cover [&_img]:rounded-2xl tablet:py-3.5 mobile:aspect-175/200 mobile:p-[12px_9px_18px] mobile:rounded-[28px] mobile:[&_img]:rounded-2xl">
                      <img
                        src={nft.imageUrl}
                        alt={`Arte de ${nft.name}`}
                        width={300}
                        height={300}
                        loading="lazy"
                      />
                      {nft.rare && (
                        <span className="rarity-label hidden mobile:block mobile:absolute mobile:top-4 mobile:left-0 mobile:bg-primary mobile:text-background mobile:p-[7px_10px] mobile:uppercase mobile:text-[12px]">
                          Raro
                        </span>
                      )}
                    </div>
                    <h3>{nft.name}</h3>
                    <p className="nft-price text-[18px] font-semibold text-primary mt-0.75 leading-6.5 wrap-anywhere tabular-nums [&_del]:text-muted-foreground [&_del]:font-normal [&_del]:text-[16px] [&_del]:whitespace-nowrap mobile:text-[16px] mobile:leading-5 mobile:m-[0_7px] mobile:[&_del]:text-[12px]">
                      {nft.priceEth} ETH{' '}
                      {nft.previousPriceEth && (
                        <del>{nft.previousPriceEth} ETH</del>
                      )}
                    </p>
                    {nft.available === 0 && (
                      <span className="sold-out-label inline-block mt-1.25 text-[12px] text-muted-foreground">
                        Edição esgotada
                      </span>
                    )}
                  </Link>
                  {index === 0 && (
                    <FavoriteButton
                      id={nft.id}
                      name={nft.name}
                      className="card-favorite hidden mobile:grid mobile:place-items-center mobile:absolute mobile:top-3 mobile:right-3 mobile:w-7 mobile:h-7 mobile:rounded-[50%] mobile:bg-card mobile:text-primary mobile:[border:1px_solid_var(--primary)]"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {data && data.totalPages > 1 && (
          <nav
            className="catalog-pagination flex gap-2 justify-end mt-19.5 [&_button]:min-w-8.75 [&_button]:h-9 [&_button]:[border:1px_solid_var(--border)] [&_button]:rounded-xs [&_button]:grid [&_button]:place-items-center [&_button]:text-[16px] **:aria-[current='page']:text-background **:aria-[current='page']:bg-primary **:aria-[current='page']:[border-color:var(--primary)] **:aria-[current='page']:font-semibold mobile:mt-16 mobile:justify-center mobile:gap-2.5"
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
