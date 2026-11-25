import { useNavigate, useSearch } from '@tanstack/react-router'
import { parseCatalogSearch, type CatalogSearch } from './catalog-search'

export function useCatalogNavigation() {
  const search = parseCatalogSearch(useSearch({ strict: false }))
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
  return { search, update, navigate }
}
