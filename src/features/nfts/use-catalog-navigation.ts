import { useNavigate, useSearch } from '@tanstack/react-router'
import { useContext } from 'react'
import { CatalogPreviewContext } from './catalog-context'
import { parseCatalogSearch, type CatalogSearch } from './catalog-search'

export function useCatalogNavigation() {
  const preview = useContext(CatalogPreviewContext)
  const routeSearch = useSearch({ strict: false })
  const search = preview ?? parseCatalogSearch(routeSearch)
  const navigate = useNavigate({ from: '/' })
  const update = (patch: Partial<CatalogSearch>) => {
    void navigate({
      search: (previous) =>
        parseCatalogSearch({ ...previous, ...patch, page: patch.page ?? 1 }),
      resetScroll: false,
      hash: 'catalogo',
      hashScrollIntoView: patch.page !== undefined,
    })
  }
  return { search, update, navigate, isPreview: preview !== null }
}
