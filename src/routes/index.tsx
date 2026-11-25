import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { NftGrid } from '@/features/nfts/components/nft-grid'
import {
  validateCatalogSearch,
  catalogDefaults,
} from '@/features/nfts/catalog-search'
import { CatalogHero } from '@/features/nfts/components/catalog-hero'
import { CatalogStories } from '@/features/nfts/components/catalog-stories'
import { MobileCatalogTools } from '@/features/nfts/components/catalog-controls'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  search: { middlewares: [stripSearchParams(catalogDefaults)] },
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <MobileCatalogTools />
      <CatalogHero />
      <NftGrid />
      <CatalogStories />
    </>
  )
}
