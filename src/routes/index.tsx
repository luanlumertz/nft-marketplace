import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogHome } from '@/features/nfts/components/catalog-home'
import {
  validateCatalogSearch,
  catalogDefaults,
} from '@/features/nfts/catalog-search'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  search: { middlewares: [stripSearchParams(catalogDefaults)] },
  component: CatalogHome,
})
