import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { CarouselDots } from '@/components/carousel-dots'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { ethToWei, parseCatalogSearch } from '../catalog-search'
import {
  weiToEth,
  type NftDetail,
  type validateDetailSearch,
} from '../detail-contracts'
import { relatedNftsOptions } from '../queries'

type DetailSearch = ReturnType<typeof validateDetailSearch>
function Gallery({ nft }: { nft: NftDetail }) {
  const zoomTrigger = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState(0),
    [zoom, setZoom] = useState(false)
  const image = nft.gallery[active] ?? nft.gallery[0]
  const move = (offset: number) =>
    setActive(
      (value) => (value + offset + nft.gallery.length) % nft.gallery.length,
    )
  return (
    <>
      <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-7 tablet:grid-cols-[64px_minmax(0,1fr)] tablet:gap-3 mobile:block">
        <div
          className="flex flex-col gap-4 mobile:hidden"
          aria-label="Galeria de imagens"
        >
          {nft.gallery.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagem ${index + 1}`}
              aria-pressed={index === active}
              className={`overflow-hidden rounded-lg border ${index === active ? 'border-primary' : 'border-transparent'}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                width={100}
                height={100}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="relative rounded-xs bg-card p-5 mobile:bg-transparent mobile:p-0">
          <button
            type="button"
            className="block w-full"
            aria-label="Abrir galeria de imagens"
            onClick={(event) => {
              zoomTrigger.current = event.currentTarget
              setZoom(true)
            }}
          >
            <img
              src={image.url}
              alt={`Arte de ${nft.name}`}
              width={500}
              height={500}
              fetchPriority="high"
              className="aspect-square w-full rounded-3xl object-cover mobile:rounded-[20px]"
            />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              zoomTrigger.current = event.currentTarget
              setZoom(true)
            }}
            aria-label="Ampliar imagem do NFT"
            className="absolute top-3 right-3 size-8 rounded-full bg-card text-foreground hover:bg-card mobile:hidden"
          >
            <Search className="size-6" />
          </Button>
        </div>
      </div>
      <CarouselDots
        count={nft.gallery.length}
        active={active}
        onSelect={setActive}
        label="Selecionar imagem da galeria"
        buttonLabel="Imagem da galeria"
        className="hidden py-3 mobile:flex"
      />
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent
          className="fixed top-1/2 left-1/2 z-81 w-[min(780px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-4"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            zoomTrigger.current?.focus()
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') move(-1)
            if (event.key === 'ArrowRight') move(1)
          }}
        >
          <DialogTitle className="sr-only">Galeria de {nft.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Use as setas para trocar a imagem e Escape para fechar.
          </DialogDescription>
          <img
            src={image.url}
            alt={image.alt}
            className="mx-auto max-h-[75dvh] rounded-2xl object-contain"
          />
          <DialogClose
            className="absolute top-4 right-4 rounded-full bg-card p-2"
            aria-label="Fechar imagem"
          >
            <X />
          </DialogClose>
          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => move(-1)}
              aria-label="Imagem anterior"
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm">
              {active + 1} / {nft.gallery.length}
            </span>
            <Button
              variant="ghost"
              onClick={() => move(1)}
              aria-label="Próxima imagem"
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetailTabs({ nft }: { nft: NftDetail }) {
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

function Related({ id, search }: { id: string; search: DetailSearch }) {
  const query = useQuery(relatedNftsOptions(id)),
    [page, setPage] = useState(0)
  const pages = Math.ceil((query.data?.items.length ?? 0) / 5)
  return (
    <section className="mt-24 mobile:hidden" aria-labelledby="related-title">
      <h2
        id="related-title"
        className="border-b border-border pb-2 text-[18px] font-semibold text-primary"
      >
        Mais desta coleção
      </h2>
      {query.isPending ? (
        <div className="mt-8 grid grid-cols-5 gap-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : query.isError ? (
        <p role="alert" className="mt-6 text-sm text-muted-foreground">
          Não foi possível carregar os itens relacionados.{' '}
          <button
            className="text-primary underline"
            onClick={() => {
              void query.refetch()
            }}
          >
            Tentar novamente
          </button>
        </p>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-5 gap-6 tablet:gap-3">
            {query.data?.items.slice(page * 5, page * 5 + 5).map((item) => (
              <li key={item.id}>
                <Link
                  to="/nfts/$nftId"
                  params={{ nftId: item.id }}
                  search={parseCatalogSearch(search)}
                  className="block"
                >
                  <div className="flex aspect-219/256 items-center overflow-hidden rounded-[12px] bg-card p-3">
                    <img
                      src={item.imageUrl}
                      alt={`Arte de ${item.name}`}
                      width={219}
                      height={256}
                      loading="lazy"
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  </div>
                  <h3 className="mt-3 text-sm">{item.name}</h3>
                  <p className="text-[18px] font-semibold text-primary">
                    {item.priceEth} ETH
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <CarouselDots
              count={pages}
              active={page}
              onSelect={setPage}
              label="Páginas de itens relacionados"
              buttonLabel="Relacionados, página"
              className="mt-6"
            />
          )}
        </>
      )}
    </section>
  )
}

export function NftDetailSkeleton() {
  return (
    <section
      role="status"
      aria-label="Carregando NFT"
      className="grid grid-cols-[minmax(0,572px)_minmax(0,1fr)] gap-8 tablet:grid-cols-2 mobile:block"
    >
      <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-7 tablet:grid-cols-[64px_minmax(0,1fr)] tablet:gap-3 mobile:block mobile:px-7 mobile:pt-16.5">
        <div className="flex flex-col gap-4 mobile:hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="aspect-square" />
          ))}
        </div>
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="hidden h-12 mobile:block" aria-hidden="true" />
      </div>
      <div className="space-y-4 mobile:relative mobile:rounded-t-[36px] mobile:bg-card mobile:px-6 mobile:pt-8 mobile:pb-48">
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-18 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="fixed inset-x-0 bottom-0 hidden h-41 rounded-t-[40px] mobile:block" />
    </section>
  )
}

export function NftDetailContent({
  nft,
  search,
}: {
  nft: NftDetail
  search: DetailSearch
}) {
  const navigate = useNavigate({ from: '/nfts/$nftId' })
  const selected =
    nft.editions.find(
      (edition) => edition.id === (search.edition ?? nft.defaultEditionId),
    ) ??
    nft.editions.find((edition) => edition.id === nft.defaultEditionId) ??
    nft.editions[0]
  const limit = selected.available,
    quantity = Math.min(search.quantity, Math.max(1, limit))
  const price =
    selected.id === nft.defaultEditionId ? nft.priceEth : selected.priceEth
  const total = weiToEth(ethToWei(price) * BigInt(quantity))
  const [shareMessage, setShareMessage] = useState('')
  useEffect(() => {
    const previous = document.title
    document.title = `${nft.name} | Kurio`
    return () => {
      document.title = previous
    }
  }, [nft.name])
  const update = (patch: { edition?: string; quantity?: number }) => {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareMessage('Link copiado.')
    } catch {
      setShareMessage('Não foi possível copiar o link.')
    }
  }
  const quantityControl = (
    <div
      className="flex shrink-0 items-center gap-3"
      aria-label="Quantidade de NFTs"
    >
      <span className="hidden text-[14px] text-muted-foreground mobile:inline">
        Qtd.
      </span>
      <Button
        size="icon"
        disabled={quantity <= 1 || limit === 0}
        aria-label="Diminuir quantidade"
        onClick={() => update({ quantity: quantity - 1 })}
        className="h-12 w-8 rounded-full mobile:h-7 mobile:w-5"
      >
        <Minus className="size-5 mobile:size-3.5" />
      </Button>
      <output
        aria-label="Quantidade selecionada"
        className="min-w-3 text-center text-[18px]"
      >
        {quantity}
      </output>
      <Button
        size="icon"
        disabled={quantity >= limit}
        aria-label="Aumentar quantidade"
        onClick={() => update({ quantity: quantity + 1 })}
        className="h-12 w-8 rounded-full mobile:h-7 mobile:w-5"
      >
        <Plus className="size-5 mobile:size-3.5" />
      </Button>
    </div>
  )
  return (
    <>
      <nav
        aria-label="Caminho de navegação"
        className="mb-3 flex gap-2 text-[14px] font-semibold mobile:hidden"
      >
        <Link to="/" search={parseCatalogSearch(search)}>
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/" search={parseCatalogSearch(search)} hash="catalogo">
          Mercado
        </Link>
      </nav>
      <article className="grid grid-cols-[minmax(0,572px)_minmax(0,1fr)] items-start gap-8 tablet:grid-cols-2 mobile:block mobile:overflow-hidden mobile:rounded-t-[40px] mobile:bg-[radial-gradient(ellipse_at_top,#3b2418,#160e0a_70%)]">
        <div className="relative mobile:px-7 mobile:pt-16.5">
          <div className="hidden mobile:absolute mobile:inset-x-7 mobile:top-6 mobile:flex mobile:justify-between">
            <Link
              to="/"
              search={parseCatalogSearch(search)}
              hash="catalogo"
              aria-label="Voltar à coleção"
              className="grid size-9 place-items-center rounded-full border border-border bg-card text-primary"
            >
              <ArrowLeft size={17} />
            </Link>
            <FavoriteButton
              id={nft.id}
              name={nft.name}
              className="size-9 rounded-full border-border bg-card"
            />
          </div>
          <Gallery nft={nft} />
        </div>
        <div className="mobile:relative mobile:rounded-t-[36px] mobile:bg-[#251610] mobile:px-6 mobile:pt-8 mobile:pb-48">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-[30px] leading-tight font-bold mobile:text-[20px]">
              {nft.name}
            </h1>
            <span className="hidden items-center gap-1 rounded-full border border-primary px-1 text-sm text-primary mobile:flex">
              <Star size={13} fill="currentColor" />
              {nft.rating.toFixed(1)}({nft.reviews.length})
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2 mobile:hidden">
            <p className="text-[22px] font-semibold text-primary">
              {price} ETH
            </p>
            <a
              href="#nft-reviews"
              className="flex items-center gap-2 text-[14px]"
              onClick={(event) => {
                event.preventDefault()
                document
                  .querySelector<HTMLButtonElement>(
                    '#nft-reviews [data-review-tab]',
                  )
                  ?.click()
                document
                  .getElementById('nft-reviews')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="flex text-primary" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={17}
                    fill={i < 4 ? 'currentColor' : '#d3b48c'}
                  />
                ))}
              </span>
              {nft.reviews.length} avaliações de colecionadores
            </a>
          </div>
          <h2 className="mt-3 text-[14px] font-semibold mobile:hidden">
            Sobre este NFT:
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-muted-foreground mobile:mt-4">
            <span className="mobile:hidden">{nft.description}</span>
            <span className="hidden mobile:inline">{nft.shortDescription}</span>
          </p>
          <fieldset className="mt-2 mobile:mt-3">
            <legend className="mb-2 text-[14px] font-semibold">Edição:</legend>
            <div className="flex flex-wrap gap-1.5">
              {nft.editions.map((edition) => (
                <Button
                  key={edition.id}
                  variant="outline"
                  size="sm"
                  disabled={edition.available === 0}
                  aria-pressed={selected.id === edition.id}
                  title={
                    edition.available === 0
                      ? 'Edição esgotada'
                      : `${edition.available} unidades disponíveis`
                  }
                  onClick={() => update({ edition: edition.id, quantity: 1 })}
                  className={`h-7 rounded-full border-border bg-transparent px-1.5 text-[14px] text-muted-foreground ${selected.id === edition.id ? 'border-primary text-primary' : ''}`}
                >
                  {edition.label}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 mobile:hidden">
            {quantityControl}
            <div className="flex gap-2">
              <Button
                disabled
                title="Compra indisponível nesta demonstração"
                className="h-10 min-w-32.5 rounded-xs disabled:opacity-100"
              >
                COMPRAR
              </Button>
              <FavoriteButton
                id={nft.id}
                name={nft.name}
                label
                className="h-10 rounded-xs"
              />
            </div>
          </div>
          {limit === 0 && (
            <p role="status" className="mt-3 text-sm text-primary">
              Edição esgotada
            </p>
          )}
          {search.quantity > Math.max(1, limit) && (
            <p role="status" className="mt-3 text-sm text-primary">
              A disponibilidade mudou. A quantidade foi ajustada para {quantity}
              .
            </p>
          )}
          <dl className="mt-4 space-y-2 text-[14px] leading-6 text-muted-foreground">
            <div className="flex gap-2">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Coleção:</dt>
              <dd>{nft.collectionName}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] mobile:hidden">
            <strong>Compartilhar este NFT:</strong>
            <a
              aria-label="Compartilhar no LinkedIn"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
            >
              <FaLinkedinIn />
            </a>
            <a
              aria-label="Compartilhar por e-mail"
              href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(window.location.href)}`}
            >
              <Mail size={16} />
            </a>
            <a
              aria-label="Compartilhar no X"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
            >
              <FaXTwitter />
            </a>
            <button
              aria-label="Copiar link do NFT"
              onClick={() => {
                void copy()
              }}
            >
              <Copy size={15} />
            </button>
            {shareMessage && (
              <span role="status" className="text-xs text-primary">
                {shareMessage}
              </span>
            )}
          </div>
          <details className="mt-6 hidden mobile:block">
            <summary className="cursor-pointer text-sm text-primary">
              Detalhes e avaliações
            </summary>
            <div className="mt-4">
              <DetailTabs nft={nft} />
            </div>
          </details>
        </div>
      </article>
      <section
        id="nft-reviews"
        className="mt-24 scroll-mt-6 mobile:hidden"
        aria-label="Informações e avaliações"
      >
        <DetailTabs nft={nft} />
      </section>
      <Related id={nft.id} search={search} />
      <div className="fixed inset-x-0 bottom-0 z-40 hidden rounded-t-[40px] bg-[#251610] px-6 pt-5 pb-[max(28px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_#160e0a33] mobile:block">
        <div className="mb-5 flex items-center justify-between gap-3">
          {quantityControl}
          <p className="min-w-0 text-right text-[20px] font-semibold break-all text-primary">
            {total} ETH
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            disabled
            title="Compra indisponível nesta demonstração"
            className="h-15 flex-1 rounded-full text-[16px] font-semibold disabled:opacity-100"
          >
            Comprar NFT
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled
            title="Carrinho indisponível nesta demonstração"
            aria-label="Carrinho indisponível"
            className="size-15 rounded-full border-border bg-transparent text-primary disabled:opacity-100"
          >
            <ShoppingCart className="size-6" />
          </Button>
        </div>
      </div>
    </>
  )
}
