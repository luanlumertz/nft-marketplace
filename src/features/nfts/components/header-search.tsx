import { lazy, Suspense, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { parseCatalogSearch } from '../catalog-search'
import { CatalogSearchForm } from './catalog-search-form'
const CatalogDialog = lazy(() => import('./catalog-dialog'))
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
