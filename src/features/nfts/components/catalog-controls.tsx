import { lazy, Suspense, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useCatalogNavigation } from '../use-catalog-navigation'
import { nftListOptions } from '../queries'
import { CatalogSearchForm } from './catalog-search-form'
import type { CatalogFilterProps } from './catalog-filter-types'
const FilterDialog = lazy(() => import('./catalog-filter-dialog'))
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

export function FilterDrawer(props: CatalogFilterProps) {
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
          <FilterDialog
            {...props}
            onClose={() => setOpen(false)}
            returnFocus={() => trigger.current?.focus({ preventScroll: true })}
          />
        </Suspense>
      )}
    </>
  )
}
