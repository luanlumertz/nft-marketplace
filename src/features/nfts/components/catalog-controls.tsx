import { lazy, Suspense, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Slider } from 'radix-ui'
import { Button } from '@/components/ui/button'
import {
  collections,
  networks,
  decimalSchema,
  ethToWei,
  catalogDefaults,
  sortOptions,
  parseCatalogSearch,
  type CatalogSearch,
} from '../catalog-search'
import { useCatalogNavigation } from '../use-catalog-navigation'
import { nftListOptions } from '../queries'
import type { NftList } from '../contracts'

export type UpdateCatalog = (patch: Partial<CatalogSearch>) => void
const CatalogDialog = lazy(() => import('./catalog-dialog'))

export function CatalogSearchForm({
  value,
  onSearch,
  autoFocus = false,
}: {
  value: string
  onSearch: (q: string) => void
  autoFocus?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const id = useId()
  return (
    <form
      role="search"
      className="catalog-search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft)
      }}
    >
      <Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        Buscar NFTs
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Explorar coleções"
        value={draft}
        maxLength={120}
        autoFocus={autoFocus}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        type="submit"
        aria-label="Pesquisar NFTs"
        className="search-submit"
      >
        Buscar
      </button>
    </form>
  )
}

export function HeaderSearch() {
  const navigate = useNavigate()
  const search = parseCatalogSearch(useSearch({ strict: false }))
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={trigger}
        className="icon-control"
        aria-label="Abrir busca"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search aria-hidden="true" />
      </button>
      {open && (
        <Suspense
          fallback={
            <span role="status" className="sr-only">
              Carregando busca…
            </span>
          }
        >
          <CatalogDialog
            title="Encontre seu próximo NFT"
            description="Busque pelo nome da obra ou pela descrição."
            closeLabel="Fechar busca"
            className="search-dialog"
            onClose={() => setOpen(false)}
            returnFocus={() => trigger.current?.focus({ preventScroll: true })}
          >
            <CatalogSearchForm
              key={search.q}
              value={search.q}
              autoFocus
              onSearch={(q) => {
                void navigate({
                  to: '/',
                  search: { ...search, q, page: 1 },
                  hash: 'catalogo',
                })
                setOpen(false)
              }}
            />
          </CatalogDialog>
        </Suspense>
      )}
    </>
  )
}

function PriceFilter({
  search,
  update,
}: {
  search: CatalogSearch
  update: UpdateCatalog
}) {
  const id = useId()
  const [min, setMin] = useState(search.minPrice)
  const [max, setMax] = useState(search.maxPrice)
  const [error, setError] = useState('')
  const apply = (event: FormEvent) => {
    event.preventDefault()
    if (
      !decimalSchema.safeParse(min).success ||
      !decimalSchema.safeParse(max).success ||
      ethToWei(min) > ethToWei(max)
    ) {
      setError('Informe preços válidos, com mínimo menor ou igual ao máximo.')
      return
    }
    setError('')
    update({ minPrice: min, maxPrice: max })
  }
  return (
    <form onSubmit={apply} className="price-filter">
      <h3>Faixa de preço</h3>
      <Slider.Root
        className="price-slider"
        min={0}
        max={12.3}
        step={0.01}
        preserveThumbOrder
        value={[
          Math.min(Math.max(Number(min) || 0, 0), 12.3),
          Math.min(Math.max(Number(max) || 0, 0), 12.3),
        ].sort((a, b) => a - b)}
        onValueChange={([minimum, maximum]) => {
          setMin(minimum.toFixed(2))
          setMax(maximum.toFixed(2))
          setError('')
        }}
      >
        <Slider.Track className="price-track">
          <Slider.Range className="price-range" />
        </Slider.Track>
        <Slider.Thumb
          className="price-thumb"
          aria-label="Ajustar preço mínimo"
        />
        <Slider.Thumb
          className="price-thumb"
          aria-label="Ajustar preço máximo"
        />
      </Slider.Root>
      <div className="price-inputs">
        <span>Preço:</span>
        <label style={{ width: `${Math.max(min.length, 4)}ch` }}>
          <span className="sr-only">De</span>
          <input
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            inputMode="decimal"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(',', '.'))}
          />
        </label>
        <span aria-hidden="true">–</span>
        <label style={{ width: `${Math.max(max.length, 4)}ch` }}>
          <span className="sr-only">Até</span>
          <input
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={!!error}
            inputMode="decimal"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(',', '.'))}
          />
        </label>
        <span>ETH</span>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="mt-3">
        Aplicar
      </Button>
    </form>
  )
}

export function CatalogFilters({
  search,
  update,
  facets,
}: {
  search: CatalogSearch
  update: UpdateCatalog
  facets?: NftList['facets']
}) {
  const hasFilters =
    !!search.q ||
    search.collections.length > 0 ||
    search.networks.length > 0 ||
    search.minPrice !== catalogDefaults.minPrice ||
    search.maxPrice !== catalogDefaults.maxPrice ||
    search.tab !== catalogDefaults.tab
  return (
    <div className="catalog-filters">
      <fieldset>
        <legend>Coleções</legend>
        {collections.map(([value, label]) => (
          <label key={value} className="filter-option">
            <input
              type="checkbox"
              checked={search.collections.includes(value)}
              onChange={() =>
                update({
                  collections: search.collections.includes(value)
                    ? search.collections.filter((item) => item !== value)
                    : [...search.collections, value],
                })
              }
            />
            <span>{label}</span>
            <span className="facet-count">
              (
              {facets?.collections.find((facet) => facet.value === value)
                ?.count ?? '…'}
              )
            </span>
          </label>
        ))}
      </fieldset>
      <PriceFilter
        key={`${search.minPrice}:${search.maxPrice}`}
        search={search}
        update={update}
      />
      <fieldset>
        <legend>Rede</legend>
        {networks.map(([value, label]) => (
          <label key={value} className="filter-option">
            <input
              type="checkbox"
              checked={search.networks.includes(value)}
              onChange={() =>
                update({
                  networks: search.networks.includes(value)
                    ? search.networks.filter((item) => item !== value)
                    : [...search.networks, value],
                })
              }
            />
            <span>{label}</span>
            <span className="facet-count">
              (
              {facets?.networks.find((facet) => facet.value === value)?.count ??
                '…'}
              )
            </span>
          </label>
        ))}
      </fieldset>
      {hasFilters && (
        <button
          className="clear-filters"
          onClick={() => update(catalogDefaults)}
        >
          Limpar filtros
        </button>
      )}
      <label className="filter-sort">
        Ordenar por
        <select
          aria-label="Ordenar por"
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
    </div>
  )
}

export function MobileCatalogTools() {
  const { search, update } = useCatalogNavigation()
  const query = useQuery(nftListOptions(search))
  return (
    <div className="mobile-catalog-tools">
      <CatalogSearchForm
        key={search.q}
        value={search.q}
        onSearch={(q) => update({ q })}
      />
      <FilterDrawer
        search={search}
        update={update}
        facets={query.data?.facets}
      />
    </div>
  )
}

export function FilterDrawer(props: Parameters<typeof CatalogFilters>[0]) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={trigger}
        className="filter-trigger"
        aria-label="Abrir filtros"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={21} aria-hidden="true" />
        <span className="sr-only">Filtros</span>
      </button>
      {open && (
        <Suspense
          fallback={
            <span role="status" className="sr-only">
              Carregando filtros…
            </span>
          }
        >
          <CatalogDialog
            title="Filtrar NFTs"
            description="Combine coleções, preço e rede."
            closeLabel="Fechar filtros"
            className="filter-drawer"
            onClose={() => setOpen(false)}
            returnFocus={() => trigger.current?.focus({ preventScroll: true })}
          >
            <CatalogFilters {...props} />
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              Ver resultados
            </Button>
          </CatalogDialog>
        </Suspense>
      )}
    </>
  )
}
