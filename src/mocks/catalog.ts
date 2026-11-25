import type { Nft, NftList } from '@/features/nfts/contracts'
import {
  collections,
  networks,
  ethToWei,
  PAGE_SIZE,
  type CatalogSearch,
} from '@/features/nfts/catalog-search'

export function queryCatalog(nfts: Nft[], search: CatalogSearch): NftList {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const filtered = nfts.filter((nft) => {
    const price = ethToWei(nft.priceEth)
    return (
      (!search.q ||
        normalize(`${nft.name} ${nft.description}`).includes(
          normalize(search.q),
        )) &&
      (!search.collections.length ||
        search.collections.includes(nft.collection)) &&
      (!search.networks.length || search.networks.includes(nft.network)) &&
      price >= ethToWei(search.minPrice) &&
      price <= ethToWei(search.maxPrice) &&
      (search.tab !== 'new' || nft.isNew) &&
      (search.tab !== 'trending' || nft.isTrending)
    )
  })
  filtered.sort((left, right) => {
    if (search.sort === 'price-asc' || search.sort === 'price-desc') {
      const a = ethToWei(left.priceEth),
        b = ethToWei(right.priceEth)
      const comparison = a < b ? -1 : a > b ? 1 : 0
      return (
        (search.sort === 'price-asc' ? comparison : -comparison) ||
        left.id.localeCompare(right.id)
      )
    }
    if (search.sort === 'popular')
      return (
        right.popularity - left.popularity || left.id.localeCompare(right.id)
      )
    return (
      right.listedAt.localeCompare(left.listedAt) ||
      left.id.localeCompare(right.id)
    )
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(search.page, totalPages)
  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    facets: {
      collections: collections.map(([value, label]) => ({
        value,
        label,
        count: nfts.filter((nft) => nft.collection === value).length,
      })),
      networks: networks.map(([value, label]) => ({
        value,
        label,
        count: nfts.filter((nft) => nft.network === value).length,
      })),
    },
    featured: nfts.slice(0, 3),
  }
}
