import type { Nft } from '@/features/nfts/contracts'
import type { NftDetail } from '@/features/nfts/detail-contracts'
import { ethToWei } from '@/features/nfts/catalog-search'
import { weiToEth } from '@/features/nfts/detail-contracts'

export function detailFor(nft: Nft): NftDetail {
  const networkName =
    nft.network === 'ethereum'
      ? 'Ethereum'
      : nft.network === 'polygon'
        ? 'Polygon'
        : 'Solana'
  return {
    ...nft,
    description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${nft.network}, com arte desbloqueável e acesso para colecionadores.`,
    shortDescription: `Um colecionável digital ${nft.edition} finalizado à mão da coleção Kurio Editions, verificado na ${nft.network === 'ethereum' ? 'Ethereum' : nft.network}.`,
    gallery: Array.from({ length: 4 }, (_, index) => ({
      url: nft.imageUrl,
      alt: `${nft.name}, imagem ${index + 1} da galeria`,
    })),
    editions: [
      {
        id: 'unique',
        label: '1/1',
        available: 0,
        priceEth: weiToEth(ethToWei(nft.priceEth) * 5n),
      },
      {
        id: 'ten',
        label: '1/10',
        available:
          nft.edition === '1/10' ? nft.available : Math.min(3, nft.available),
        priceEth:
          nft.edition === '1/10'
            ? nft.priceEth
            : weiToEth(ethToWei(nft.priceEth) * 2n),
      },
      {
        id: 'fifty',
        label: '1/50',
        available: nft.available,
        priceEth: nft.priceEth,
      },
      {
        id: 'open',
        label: 'ABERTA',
        available: nft.available,
        priceEth: nft.priceEth,
      },
    ],
    defaultEditionId: nft.edition === '1/10' ? 'ten' : 'fifty',
    tokenId: `#${(nft.name.split('#')[1] ?? '1').padStart(4, '0')}`,
    collectionName: 'Kurio Apes',
    attributes: nft.imageUrl.includes('green')
      ? ['Óculos', 'Esmeralda', 'Raro']
      : ['Arte digital', 'Edição limitada', 'Colecionável'],
    fullDescription: [
      `${nft.name} é uma obra digital ${nft.edition} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${networkName}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    networkDescription: `Cunhado na ${networkName} com procedência imutável e metadados armazenados no IPFS.`,
    contractAddress: '0x7A42...19E8',
    royalties:
      'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
    rating: 4.8,
    reviews: Array.from({ length: 19 }, (_, index) => ({
      id: `${nft.id}-review-${index}`,
      author: ['Marina Alves', 'Pedro Santos', 'Camila Rocha', 'Rafael Costa'][
        index % 4
      ],
      rating: index < 15 ? 5 : 4,
      text: [
        'Arte incrível! Os detalhes e as cores fazem esta edição se destacar na coleção.',
        'Uma ótima adição à minha coleção. Gostei muito da identidade do artista.',
        'A composição e os atributos deixam a obra ainda mais especial.',
      ][index % 3],
      date: `${String(10 + (index % 15)).padStart(2, '0')}/11/2026`,
    })),
  }
}
export function relatedFor(nft: Nft, nfts: Nft[]) {
  const preferred = [
    'cosmic-bloom-118',
    'violet-nomad-314',
    'ivory-baron-088',
    'golden-beat-207',
    'golden-signal-160',
  ]
  return nfts
    .filter((item) => item.id !== nft.id && item.collection === nft.collection)
    .sort(
      (a, b) =>
        (preferred.indexOf(a.id) < 0 ? 99 : preferred.indexOf(a.id)) -
        (preferred.indexOf(b.id) < 0 ? 99 : preferred.indexOf(b.id)),
    )
    .slice(0, 15)
}
