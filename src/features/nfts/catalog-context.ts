import { createContext } from 'react'
import type { CatalogSearch } from './catalog-search'
export const CatalogPreviewContext = createContext<CatalogSearch | null>(null)
