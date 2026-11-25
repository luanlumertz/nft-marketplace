import { CatalogHero } from './catalog-hero'
import { CatalogStories } from './catalog-stories'
import { MobileCatalogTools } from './catalog-controls'
import { NftGrid } from './nft-grid'
export function CatalogHome() {
  return (
    <>
      <MobileCatalogTools />
      <CatalogHero />
      <NftGrid />
      <CatalogStories />
    </>
  )
}
