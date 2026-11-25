import { z } from 'zod'
import type { SearchSchemaInput } from '@tanstack/react-router'

export const collections = [
  ['arte-digital', 'Arte digital'],
  ['fotografia', 'Fotografia'],
  ['musica', 'Música'],
  ['arte-3d', 'Arte 3D'],
  ['colecionaveis', 'Colecionáveis'],
  ['generativa', 'Generativa'],
  ['jogos', 'Jogos'],
  ['assinaturas', 'Assinaturas'],
  ['utilidade', 'Utilidade'],
] as const
export const networks = [
  ['ethereum', 'Ethereum'],
  ['polygon', 'Polygon'],
  ['solana', 'Solana'],
] as const
export const sortOptions = [
  ['recent', 'Listados recentemente'],
  ['price-asc', 'Menor preço'],
  ['price-desc', 'Maior preço'],
  ['popular', 'Mais populares'],
] as const
export const tabs = [
  ['all', 'Todos os NFTs'],
  ['new', 'Novos lançamentos'],
  ['trending', 'Em alta'],
] as const
export type Collection = (typeof collections)[number][0]
export type Network = (typeof networks)[number][0]

export const decimalSchema = z.string().regex(/^\d{1,12}(?:\.\d{1,18})?$/)
export function ethToWei(value: string): bigint {
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
}

function decimal(value: unknown, fallback: string) {
  const parsed = decimalSchema.safeParse(
    typeof value === 'number' ? String(value) : value,
  )
  return parsed.success
    ? parsed.data.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
    : fallback
}
function selection<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []
  return [
    ...new Set(
      values.filter(
        (item): item is T =>
          typeof item === 'string' && allowed.includes(item as T),
      ),
    ),
  ].sort()
}

export function parseCatalogSearch(raw: Record<string, unknown>) {
  const minPrice = decimal(raw.minPrice, '0')
  const maxPrice = decimal(raw.maxPrice, '12.3')
  const validRange = ethToWei(minPrice) <= ethToWei(maxPrice)
  return {
    q: typeof raw.q === 'string' ? raw.q.trim().slice(0, 120) : '',
    collections: selection(
      raw.collections,
      collections.map(([value]) => value),
    ),
    networks: selection(
      raw.networks,
      networks.map(([value]) => value),
    ),
    minPrice: validRange ? minPrice : '0',
    maxPrice: validRange ? maxPrice : '12.3',
    sort: z
      .enum(['recent', 'price-asc', 'price-desc', 'popular'])
      .catch('recent')
      .parse(raw.sort),
    tab: z.enum(['all', 'new', 'trending']).catch('all').parse(raw.tab),
    page: z.coerce.number().int().min(1).max(10000).catch(1).parse(raw.page),
  }
}
export type CatalogSearch = ReturnType<typeof parseCatalogSearch>
export const catalogDefaults = parseCatalogSearch({})
export function validateCatalogSearch(
  raw: SearchSchemaInput & Partial<CatalogSearch>,
): CatalogSearch {
  return parseCatalogSearch(raw)
}
export const PAGE_SIZE = 9
export function catalogApiParams(search: CatalogSearch) {
  return {
    ...search,
    collections: search.collections.join(','),
    networks: search.networks.join(','),
  }
}
