import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Copy,
  Mail,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { useCart } from '@/features/cart/use-cart'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ethToWei, parseCatalogSearch } from '../catalog-search'
import {
  weiToEth,
  type NftDetail,
  type validateDetailSearch,
} from '../detail-contracts'
import { NftGallery } from './nft-gallery'
import { NftDetailTabs } from './nft-detail-tabs'
import { NftRecommendations } from './nft-recommendations'

type DetailSearch = ReturnType<typeof validateDetailSearch>
export function NftDetailSkeleton() {
  return (
    <section
      role="status"
      aria-label="Carregando NFT"
      className="grid min-h-338 grid-cols-[minmax(0,572px)_minmax(0,1fr)] content-start gap-8 tablet:grid-cols-2 mobile:block mobile:min-h-0"
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
  const cart = useCart()
  const [cartNotice, setCartNotice] = useState('')
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
  const addToCart = (open: boolean) => {
    setCartNotice('')
    cart.run(
      {
        type: 'add',
        selection: { nftId: nft.id, editionId: selected.id, quantity },
      },
      () => {
        if (open) void navigate({ to: '/carrinho' })
        else setCartNotice('NFT adicionado ao carrinho.')
      },
    )
  }
  const [shareMessage, setShareMessage] = useState('')
  useDocumentTitle(`${nft.name} | Kurio`)
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
          <NftGallery nft={nft} />
        </div>
        <div className="mobile:relative mobile:rounded-t-[36px] mobile:bg-[#251610] mobile:px-6 mobile:pt-8 mobile:pb-48">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-[30px] leading-tight font-bold mobile:text-[20px]">
              {nft.name}
            </h1>
            <span
              className="hidden items-center gap-1 rounded-full border border-primary/70 px-1.5 py-0.5 text-[11px] leading-none text-foreground mobile:flex"
              aria-label={`${nft.rating.toFixed(1)} de 5 estrelas, ${nft.reviews.length} avaliações`}
            >
              <Star
                size={12}
                fill="currentColor"
                className="shrink-0 text-amber-400"
                aria-hidden="true"
              />
              <span>
                {nft.rating.toFixed(1)} ({nft.reviews.length})
              </span>
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
              <span className="flex gap-0.5 text-primary" aria-hidden="true">
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
                disabled={limit === 0 || !cart.ready || cart.pending}
                onClick={() => addToCart(true)}
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
          {(cart.message || cartNotice) && (
            <p
              role={cart.message ? 'alert' : 'status'}
              className="mt-3 text-sm text-primary"
            >
              {cart.message || cartNotice}
            </p>
          )}
          {cart.query.isError && (
            <p role="alert" className="mt-3 text-sm text-primary">
              Não foi possível carregar o carrinho.{' '}
              <Button
                variant="link"
                onClick={() => {
                  void cart.query.refetch()
                }}
              >
                Recarregar carrinho
              </Button>
            </p>
          )}
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
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] [&>a]:grid [&>a]:size-6 [&>a]:place-items-center [&>button]:grid [&>button]:size-6 [&>button]:place-items-center mobile:hidden">
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
              <NftDetailTabs nft={nft} />
            </div>
          </details>
        </div>
      </article>
      <section
        id="nft-reviews"
        className="mt-24 scroll-mt-6 mobile:hidden"
        aria-label="Informações e avaliações"
      >
        <NftDetailTabs nft={nft} />
      </section>
      <NftRecommendations id={nft.id} search={search} />
      <div className="fixed inset-x-0 bottom-0 z-40 hidden rounded-t-[40px] bg-[#251610] px-6 pt-5 pb-[max(28px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_#160e0a33] mobile:block">
        <div className="mb-5 flex items-center justify-between gap-3">
          {quantityControl}
          <p className="min-w-0 text-right text-[20px] font-semibold break-all text-primary">
            {total} ETH
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            disabled={limit === 0 || !cart.ready || cart.pending}
            onClick={() => addToCart(true)}
            className="h-15 flex-1 rounded-full text-[16px] font-semibold disabled:opacity-100"
          >
            Comprar NFT
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={limit === 0 || !cart.ready || cart.pending}
            onClick={() => addToCart(false)}
            aria-label="Adicionar ao carrinho"
            className="size-15 rounded-full border-border bg-transparent text-primary disabled:opacity-100"
          >
            <ShoppingCart className="size-6" />
          </Button>
        </div>
      </div>
    </>
  )
}
