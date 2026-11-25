import { lazy, Suspense, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
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
      className="catalog-search flex items-center gap-2.5 min-w-0 p-[10px_14px] bg-card rounded-lg text-muted-foreground [&_input]:bg-transparent [&_input]:w-full [&_input]:min-w-0 [&_input]:text-[14px] [&_input]:text-foreground [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100"
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
        className="search-submit text-primary text-[12px]"
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
        className="icon-control w-7 h-10 grid place-items-center"
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
            className="search-dialog fixed top-[18vh] left-[max(24px,calc(50%-280px))] w-[min(560px,calc(100%-48px))] p-[36px_28px_28px] [border:1px_solid_var(--border)] rounded-2xl bg-card z-81"
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
    <form onSubmit={apply} className="price-filter mt-8 mb-9">
      <h3>Faixa de preço</h3>
      <Slider
        thumbLabels={['Ajustar preço mínimo', 'Ajustar preço máximo']}
        className="price-slider relative flex items-center h-7 m-[2px_7px_0] touch-none select-none"
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
      />
      <div className="price-inputs flex gap-1.25 items-center text-[11px] [&_label]:min-w-0 [&_label]:flex-[0_1_auto] [&_input]:w-full [&_input]:block [&_input]:p-[2px_0] [&_input]:text-foreground [&_input]:bg-transparent">
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
    <div className="catalog-filters bg-card p-[16px_20px_20px] [&_legend]:text-[18px] [&_legend]:font-semibold [&_legend]:mb-2.5 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:mb-2.5 [&_fieldset]:min-w-0">
      <fieldset>
        <legend>Coleções</legend>
        {collections.map(([value, label]) => (
          <label
            key={value}
            className="filter-option relative flex items-center gap-1.25 justify-between min-h-10 m-[0_4px] p-[3px_8px] text-[14px] text-muted-foreground cursor-pointer [&_input]:absolute [&_input]:w-px [&_input]:h-px [&_input]:opacity-0 [&:has(input:focus-visible)]:[outline:2px_solid_var(--primary)] [&:has(input:focus-visible)]:outline-offset-1 [&:has(input:checked)]:text-primary [&:has(input:checked)]:font-semibold [&:has(input:checked)]:[box-shadow:inset_2px_0_var(--primary)]"
          >
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
            <span className="facet-count ml-auto text-[13px]">
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
          <label
            key={value}
            className="filter-option relative flex items-center gap-1.25 justify-between min-h-10 m-[0_4px] p-[3px_8px] text-[14px] text-muted-foreground cursor-pointer [&_input]:absolute [&_input]:w-px [&_input]:h-px [&_input]:opacity-0 [&:has(input:focus-visible)]:[outline:2px_solid_var(--primary)] [&:has(input:focus-visible)]:outline-offset-1 [&:has(input:checked)]:text-primary [&:has(input:checked)]:font-semibold [&:has(input:checked)]:[box-shadow:inset_2px_0_var(--primary)]"
          >
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
            <span className="facet-count ml-auto text-[13px]">
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
          className="clear-filters block mt-5 text-[12px] text-primary underline underline-offset-4"
          onClick={() => update(catalogDefaults)}
        >
          Limpar filtros
        </button>
      )}
      <label className="filter-sort hidden [&_select]:bg-card [&_select]:[border:1px_solid_var(--border)] [&_select]:p-2.5 [&_select]:rounded-sm">
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
    <div className="mobile-catalog-tools hidden mobile:flex mobile:gap-2 mobile:mb-4 mobile:[&_.catalog-search]:flex-1 mobile:[&_.catalog-search]:min-h-11.25 mobile:[&_.catalog-search_input]:text-[13px] mobile:[&_.catalog-search_input]:font-medium mobile:[&_.search-submit]:absolute mobile:[&_.search-submit]:w-px mobile:[&_.search-submit]:h-px mobile:[&_.search-submit]:overflow-hidden mobile:[&_.search-submit]:[clip-path:inset(50%)] mobile:[&_.search-submit:focus-visible]:static mobile:[&_.search-submit:focus-visible]:w-auto mobile:[&_.search-submit:focus-visible]:h-auto mobile:[&_.search-submit:focus-visible]:[clip-path:none]">
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
        className="filter-trigger grid place-items-center shrink-0 h-11.25 w-11.25 rounded-2xl [background:linear-gradient(130deg,#956033,var(--primary))] text-background"
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
            className="filter-drawer fixed right-0 top-0 h-dvh w-[min(420px,100%)] p-[30px_24px] overflow-y-auto overscroll-contain bg-background [border-left:1px_solid_var(--border)] z-81 [&_.catalog-filters]:p-0 [&_.catalog-filters]:[background:none] [&_.filter-sort]:flex [&_.filter-sort]:flex-col [&_.filter-sort]:gap-2.5 [&_.filter-sort]:text-[14px] [&_.filter-sort]:mt-6"
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
