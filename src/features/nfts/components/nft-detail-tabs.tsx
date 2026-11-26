import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NftDetail } from '../detail-contracts'

export function NftDetailTabs({ nft }: { nft: NftDetail }) {
  const [visible, setVisible] = useState(3)
  const allVisible = visible >= nft.reviews.length
  return (
    <Tabs defaultValue="details" className="gap-4">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto mobile:gap-4"
      >
        <TabsTrigger
          value="details"
          className="h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-0 pb-2 text-[16px] font-normal text-foreground shadow-none after:hidden data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none mobile:text-[12px]"
        >
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          data-review-tab
          className="h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-0 pb-2 text-[16px] font-normal text-foreground shadow-none after:hidden data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none mobile:text-[12px]"
        >
          Avaliações de colecionadores ({nft.reviews.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="details"
        className="space-y-6 text-[14px] leading-6 text-muted-foreground"
      >
        {nft.fullDescription.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <dl className="space-y-4">
          <div>
            <dt className="font-semibold text-foreground">Rede:</dt>
            <dd>{nft.networkDescription}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Contrato:</dt>
            <dd>{nft.royalties}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">
              Direitos autorais:
            </dt>
            <dd>
              {nft.contractAddress} • Contrato inteligente ERC-721 verificado.
            </dd>
          </div>
        </dl>
      </TabsContent>
      <TabsContent value="reviews" className="space-y-4">
        {nft.reviews.slice(0, visible).map((review) => (
          <article
            key={review.id}
            className="rounded-xl border border-border p-4 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold">{review.author}</h3>
              <span
                className="text-primary"
                aria-label={`${review.rating} de 5 estrelas`}
              >
                {'★'.repeat(review.rating)}
              </span>
            </div>
            <p className="mt-2 leading-6 text-muted-foreground">
              {review.text}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{review.date}</p>
          </article>
        ))}
        {nft.reviews.length > 3 && (
          <Button
            variant={allVisible ? 'default' : 'outline'}
            onClick={() =>
              setVisible((value) =>
                allVisible ? 3 : Math.min(value + 3, nft.reviews.length),
              )
            }
          >
            {allVisible
              ? 'Mostrar menos avaliações'
              : 'Mostrar mais avaliações'}
          </Button>
        )}
      </TabsContent>
    </Tabs>
  )
}
