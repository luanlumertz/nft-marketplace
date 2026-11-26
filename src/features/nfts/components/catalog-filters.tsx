import { useId, useState, type FormEvent } from 'react'
import { Slider } from '@/components/ui/slider'
import { SelectControl } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  collections,
  networks,
  decimalSchema,
  ethToWei,
  catalogDefaults,
  sortOptions,
  type CatalogSearch,
} from '../catalog-search'
import type { NftList } from '../contracts'
import type { UpdateCatalog } from './catalog-filter-types'

function FilterGroup<Value extends string>({
  title,
  options,
  selected,
  facets,
  onChange,
}: {
  title: string
  options: readonly (readonly [Value, string])[]
  selected: readonly Value[]
  facets?: NftList['facets']['collections']
  onChange: (values: Value[]) => void
}) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {options.map(([value, label]) => (
        <label
          key={value}
          className="filter-option relative flex items-center gap-1.25 justify-between min-h-10 m-[0_4px] p-[3px_8px] text-[14px] text-muted-foreground cursor-pointer [&_input]:absolute [&_input]:w-px [&_input]:h-px [&_input]:opacity-0 [&:has(input:focus-visible)]:[outline:2px_solid_var(--primary)] [&:has(input:focus-visible)]:outline-offset-1 [&:has(input:checked)]:text-primary [&:has(input:checked)]:font-semibold [&:has(input:checked)]:[box-shadow:inset_2px_0_var(--primary)]"
        >
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() =>
              onChange(
                selected.includes(value)
                  ? selected.filter((item) => item !== value)
                  : [...selected, value],
              )
            }
          />
          <span>{label}</span>
          <span className="facet-count ml-auto text-[13px]">
            ({facets?.find((facet) => facet.value === value)?.count ?? '…'})
          </span>
        </label>
      ))}
    </fieldset>
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

export default function CatalogFilters({
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
      <FilterGroup
        title="Coleções"
        options={collections}
        selected={search.collections}
        facets={facets?.collections}
        onChange={(collections) => update({ collections })}
      />
      <PriceFilter
        key={`${search.minPrice}:${search.maxPrice}`}
        search={search}
        update={update}
      />
      <FilterGroup
        title="Rede"
        options={networks}
        selected={search.networks}
        facets={facets?.networks}
        onChange={(networks) => update({ networks })}
      />
      {hasFilters && (
        <button
          className="clear-filters block mt-5 text-[12px] text-primary underline underline-offset-4"
          onClick={() => update(catalogDefaults)}
        >
          Limpar filtros
        </button>
      )}
      <label className="filter-sort hidden">
        Ordenar por
        <SelectControl
          aria-label="Ordenar por"
          value={search.sort}
          options={sortOptions}
          onValueChange={(value) =>
            update({ sort: value as CatalogSearch['sort'] })
          }
        />
      </label>
    </div>
  )
}
