import type { Nft } from '@/features/nfts/contracts'

export const nftFixtures: Nft[] = [
  {
    id: 'emerald-ape-042', name: 'Emerald Ape #042',
    description: 'Um colecionável digital da coleção Kurio Editions. Óculos esmeralda e jaqueta verde em uma edição limitada.',
    imageUrl: '/nfts/jungle-green.png', priceEth: '1.19', available: 12,
    edition: '1/50', network: 'ethereum', version: 1,
  },
  {
    id: 'violet-nomad-314', name: 'Violet Nomad #314',
    description: 'Arte digital da coleção Kurio Apes, com chapéu verde e moletom violeta.',
    imageUrl: '/nfts/jungle-violet.png', priceEth: '1.39', available: 8,
    edition: '1/10', network: 'polygon', version: 1,
  },
  {
    id: 'ivory-baron-088', name: 'Ivory Baron #088',
    description: 'Uma peça da coleção Kurio Apes com blazer claro e detalhes dourados.',
    imageUrl: '/nfts/jungle-gray.png', priceEth: '1.79', available: 4,
    edition: '1/10', network: 'ethereum', version: 1,
  },
  {
    id: 'golden-beat-207', name: 'Golden Beat #207',
    description: 'Um colecionável da coleção Kurio Apes inspirado na música, com fones verdes e pelagem dourada.',
    imageUrl: '/nfts/jungle-orange.png', priceEth: '0.99', available: 20,
    edition: '1/50', network: 'solana', version: 1,
  },
]
