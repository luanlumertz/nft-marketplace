import type { Nft } from '@/features/nfts/contracts'
import { collections, networks } from '@/features/nfts/catalog-search'

const originals = [
  ['emerald-ape-042', 'Emerald Ape #042', 'green', '1.19', 'ethereum'],
  ['sage-nomad-009', 'Sage Nomad #009', 'violet', '1.69', 'polygon'],
  ['neon-vessel-552', 'Neon Vessel #552', 'gray', '1.99', 'solana'],
  ['cosmic-bloom-118', 'Cosmic Bloom #118', 'violet', '1.29', 'ethereum'],
  ['violet-nomad-314', 'Violet Nomad #314', 'violet', '1.39', 'polygon'],
  ['ivory-baron-088', 'Ivory Baron #088', 'gray', '1.79', 'ethereum'],
  ['golden-beat-207', 'Golden Beat #207', 'orange', '0.99', 'solana'],
  [
    'golden-frequency-071',
    'Golden Frequency #071',
    'orange',
    '0.59',
    'polygon',
  ],
  ['golden-signal-160', 'Golden Signal #160', 'orange', '0.39', 'ethereum'],
] as const

export const nftFixtures: Nft[] = Array.from({ length: 36 }, (_, index) => {
  const original = originals[index % originals.length]
  const page = Math.floor(index / originals.length)
  return {
    id: page === 0 ? original[0] : `${original[0]}-edition-${page + 1}`,
    name:
      page === 0
        ? original[1]
        : `${original[1].split(' #')[0]} #${600 + index}`,
    description:
      'Um colecionável digital finalizado à mão da coleção Kurio Editions, com arte desbloqueável e acesso para colecionadores.',
    imageUrl: `/nfts/jungle-${original[2]}.png`,
    priceEth:
      page === 0
        ? original[3]
        : `${page + 3}.${String(3 + index * 7).padStart(2, '0')}`,
    previousPriceEth: index === 2 ? '2.29' : undefined,
    available: index === 19 ? 0 : 4 + (index % 17),
    edition: index % 3 === 0 ? '1/50' : '1/10',
    network: page === 0 ? original[4] : networks[index % networks.length][0],
    version: 1,
    collection:
      page === 0
        ? 'arte-digital'
        : collections[(index - 9) % collections.length][0],
    listedAt: new Date(Date.UTC(2026, 10, 24, 12, -index)).toISOString(),
    popularity: 1000 - ((index * 37) % 600),
    isNew: index % 2 === 0,
    isTrending: index % 3 === 0,
    rare: index % 3 === 2,
  }
})
