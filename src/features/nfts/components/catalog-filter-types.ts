import type { CatalogSearch } from '../catalog-search'
import type { NftList } from '../contracts'

export type UpdateCatalog = (patch: Partial<CatalogSearch>) => void
export type CatalogFilterProps = {
  search: CatalogSearch
  update: UpdateCatalog
  facets?: NftList['facets']
}
