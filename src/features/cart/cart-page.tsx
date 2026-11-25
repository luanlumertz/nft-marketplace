import { useEffect, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { NftRecommendations } from '@/features/nfts/components/nft-detail'
import { catalogDefaults } from '@/features/nfts/catalog-search'
import { useCart } from './use-cart'
import type { CartItem, CartCommand } from './contracts'

function CartRow({
  item,
  pending,
  run,
}: {
  item: CartItem
  pending: boolean
  run: (command: CartCommand) => void
}) {
  const selection = {
    nftId: item.nftId,
    editionId: item.editionId,
    quantity: item.quantity,
  }
  return (
    <li className="relative grid min-h-17.5 grid-cols-[minmax(240px,2.25fr)_1fr_1fr_1fr_44px] items-center bg-[#251610] mobile:block mobile:min-h-25 mobile:rounded-2xl">
      <div className="flex min-w-0 items-center gap-4 mobile:gap-2.5">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: item.nftId }}
          search={{ ...catalogDefaults, edition: item.editionId }}
          tabIndex={-1}
          aria-hidden="true"
          className="shrink-0"
        >
          <img
            src={item.imageUrl}
            alt=""
            width={70}
            height={70}
            className="size-17.5 rounded-sm object-cover mobile:h-25 mobile:w-23 mobile:rounded-2xl"
          />
        </Link>
        <div className="min-w-0 flex-1 pr-2 mobile:self-start mobile:pt-2.5">
          <h2 className="text-[16px] font-semibold mobile:text-[14px]">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: item.nftId }}
              search={{ ...catalogDefaults, edition: item.editionId }}
            >
              {item.name}
              <span className="sr-only">, edição {item.editionLabel}</span>
            </Link>
          </h2>
          <p className="text-[14px] text-muted-foreground mobile:hidden">
            ID do token: {item.tokenId}
          </p>
          <p className="text-xs text-muted-foreground mobile:hidden">
            Edição: {item.editionLabel}
          </p>
          <p className="hidden text-[13px] text-muted-foreground mobile:block">
            Edição: {item.editionLabel}
          </p>
          <p className="mt-3 hidden text-[18px] font-semibold text-primary mobile:block mobile:max-w-[calc(100%-108px)] mobile:break-all">
            {item.totalEth} ETH
          </p>
        </div>
      </div>
      <p className="pr-3 text-[16px] font-semibold text-muted-foreground wrap-anywhere mobile:hidden">
        {item.unitPriceEth} ETH
      </p>
      <div className="flex items-center gap-1 mobile:absolute mobile:right-10 mobile:bottom-3.5 mobile:gap-0">
        <Button
          size="icon"
          disabled={pending || item.quantity <= 1}
          onClick={() =>
            run({
              type: 'quantity',
              selection: { ...selection, quantity: item.quantity - 1 },
            })
          }
          aria-label={`Diminuir quantidade de ${item.name}, edição ${item.editionLabel}`}
          className="size-7 rounded-full mobile:border mobile:border-border mobile:bg-transparent mobile:text-foreground"
        >
          <Minus className="size-4" />
        </Button>
        <output
          aria-label={`Quantidade de ${item.name}, edição ${item.editionLabel}`}
          className="min-w-7 text-center text-[16px]"
        >
          {item.quantity}
        </output>
        <Button
          size="icon"
          disabled={pending || item.quantity >= item.available}
          onClick={() =>
            run({
              type: 'quantity',
              selection: { ...selection, quantity: item.quantity + 1 },
            })
          }
          aria-label={`Aumentar quantidade de ${item.name}, edição ${item.editionLabel}`}
          className="size-7 rounded-full mobile:border mobile:border-border mobile:bg-transparent mobile:text-foreground"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <p className="pr-3 text-[16px] font-semibold text-primary wrap-anywhere mobile:hidden">
        {item.totalEth} ETH
      </p>
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={() =>
          run({ type: 'remove', nftId: item.nftId, editionId: item.editionId })
        }
        aria-label={`Remover ${item.name}, edição ${item.editionLabel}`}
        className="text-muted-foreground mobile:absolute mobile:right-1 mobile:bottom-2.5 mobile:text-primary"
      >
        <Trash2 className="size-5" />
      </Button>
      {item.issue && (
        <div
          role="status"
          className="col-span-5 px-3 py-2 text-xs text-primary mobile:pb-3"
        >
          {item.issue === 'sold-out'
            ? 'Esta edição está esgotada. Remova o item para continuar.'
            : `Restam ${item.available} unidades desta edição.`}
          {item.issue === 'insufficient' && (
            <Button
              variant="link"
              className="h-auto px-2 py-1 text-xs"
              disabled={pending}
              onClick={() =>
                run({
                  type: 'quantity',
                  selection: { ...selection, quantity: item.available },
                })
              }
            >
              Ajustar quantidade
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

export function CartPage() {
  const cart = useCart()
  const data = cart.query.data
  const canConnect =
    !!data?.quote.canCheckout &&
    !cart.pending &&
    !cart.query.isFetching &&
    !cart.query.isError
  const [code, setCode] = useState('')
  useEffect(() => {
    const previous = document.title
    document.title = 'Carrinho de NFTs | Kurio'
    return () => {
      document.title = previous
    }
  }, [])
  const submitCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.trim())
      cart.run({ type: 'coupon', code: code.trim() }, () => setCode(''))
  }
  const loading = cart.query.isPending
  return (
    <div className="mobile:flex mobile:min-h-svh mobile:flex-col">
      <nav
        aria-label="Caminho de navegação"
        className="mb-2 flex gap-2 text-[14px] font-semibold mobile:hidden"
      >
        <Link to="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link to="/" hash="catalogo">
          Mercado
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Carrinho</span>
      </nav>
      <header className="relative hidden items-center justify-center px-7 py-7.5 mobile:flex">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="absolute left-7 size-9 rounded-full bg-card text-primary"
        >
          <Link to="/" hash="catalogo" aria-label="Voltar ao catálogo">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-[20px] font-semibold">Carrinho de NFTs</h1>
      </header>
      <h1 className="sr-only mobile:hidden">Carrinho de NFTs</h1>
      {(cart.query.isError && !data) || cart.session.isError ? (
        <section
          role="alert"
          className="rounded-2xl border border-border bg-card p-6 mobile:mx-7"
        >
          <p>Não foi possível carregar o carrinho.</p>
          <Button
            className="mt-4"
            onClick={() => {
              if (cart.session.isError) void cart.session.refetch()
              else void cart.query.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      ) : !loading && !data?.items.length ? (
        <section className="grid min-h-80 place-content-center gap-5 text-center mobile:px-7">
          <ShoppingCart className="mx-auto size-12 text-primary" />
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="text-sm text-muted-foreground">
            Encontre uma obra para começar sua coleção.
          </p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        </section>
      ) : (
        <div className="grid grid-cols-[minmax(0,782px)_minmax(0,332px)] items-start gap-21.5 tablet:grid-cols-1 tablet:gap-8 mobile:flex mobile:flex-1 mobile:flex-col mobile:items-stretch mobile:gap-8">
          <section
            aria-label="Itens do carrinho"
            className="min-w-0 mobile:px-7"
          >
            <div
              aria-hidden="true"
              className="mb-3 grid grid-cols-[minmax(240px,2.25fr)_1fr_1fr_1fr_44px] border-b border-border pb-2 text-[16px] font-semibold mobile:hidden"
            >
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            {loading ? (
              <div
                role="status"
                aria-label="Carregando carrinho"
                className="space-y-3 mobile:space-y-5"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-17.5 mobile:h-25 mobile:rounded-2xl"
                  />
                ))}
              </div>
            ) : (
              <ul
                className="space-y-3 mobile:space-y-5"
                aria-label="NFTs no carrinho"
              >
                {data?.items.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    pending={cart.pending || cart.query.isFetching}
                    run={cart.run}
                  />
                ))}
              </ul>
            )}
          </section>
          <section
            aria-labelledby="cart-summary-title"
            className="min-w-0 mobile:mt-auto mobile:rounded-t-[40px] mobile:bg-[#251610] mobile:px-6 mobile:pt-6 mobile:pb-[max(36px,env(safe-area-inset-bottom))]"
          >
            <h2
              id="cart-summary-title"
              className="mb-5 border-b border-border pb-2 text-[18px] font-semibold mobile:sr-only"
            >
              Resumo da carteira
            </h2>
            {loading ? (
              <div
                role="status"
                aria-label="Carregando resumo do carrinho"
                className="space-y-5"
              >
                <Skeleton className="h-16" />
                <Skeleton className="h-24" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              data && (
                <>
                  <form onSubmit={submitCoupon} aria-label="Código promocional">
                    <label
                      htmlFor="cart-coupon"
                      className="mb-2 block text-[14px] font-semibold mobile:sr-only"
                    >
                      Código promocional
                    </label>
                    <div className="flex rounded-xs border border-border bg-[#382418] mobile:rounded-full">
                      <Input
                        id="cart-coupon"
                        value={code}
                        maxLength={40}
                        onChange={(event) => {
                          setCode(event.target.value)
                          cart.mutation.reset()
                        }}
                        placeholder="Digite o código promocional..."
                        aria-describedby={
                          cart.message ? 'cart-error' : undefined
                        }
                        className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 text-[12px] shadow-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent mobile:h-12.5 mobile:rounded-full mobile:px-4"
                      />
                      <Button
                        type="submit"
                        disabled={
                          !code.trim() || cart.pending || cart.query.isFetching
                        }
                        className="h-10 rounded-l-none rounded-r-xs px-5 font-semibold mobile:h-12.5 mobile:rounded-full mobile:bg-linear-to-r mobile:from-[#8a5734] mobile:to-primary mobile:text-foreground disabled:opacity-100"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </form>
                  {data.quote.coupon && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-primary">
                      <span>
                        {data.quote.coupon.code}
                        {!data.quote.coupon.valid &&
                          ' — cupom inválido ou expirado'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cart.pending}
                        onClick={() => cart.run({ type: 'coupon', code: null })}
                        aria-label="Remover cupom"
                      >
                        <X className="size-3" />
                        Remover
                      </Button>
                    </div>
                  )}
                  <dl
                    aria-label="Valores do carrinho"
                    aria-busy={cart.query.isFetching}
                    className="mt-5 space-y-3 text-[14px] mobile:mt-3 mobile:space-y-2"
                  >
                    <div className="flex justify-between gap-3">
                      <dt>Subtotal</dt>
                      <dd className="text-right text-[18px] wrap-anywhere mobile:text-[16px]">
                        {data.quote.subtotalEth} ETH
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Desconto do lançamento</dt>
                      <dd className="text-right wrap-anywhere">
                        (-){' '}
                        {data.quote.discountEth === '0'
                          ? '00.00'
                          : `${data.quote.discountEth} ETH`}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Taxa de rede</dt>
                      <dd className="text-right">
                        <span className="text-[18px] wrap-anywhere mobile:text-[16px]">
                          {data.quote.networkFeeEth} ETH
                        </span>
                        <span className="mt-1 block text-[12px] text-primary">
                          Taxa estimada
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 pt-2 text-[18px] font-semibold">
                      <dt>Total</dt>
                      <dd className="text-right text-primary wrap-anywhere">
                        {data.quote.totalEth} ETH
                      </dd>
                    </div>
                  </dl>
                  {!data.quote.canCheckout && (
                    <p role="status" className="mt-4 text-xs text-primary">
                      Revise a disponibilidade dos itens e o cupom antes de
                      continuar.
                    </p>
                  )}
                  {cart.user ? (
                    <Button
                      disabled
                      title="Pagamento indisponível nesta etapa"
                      className="mt-5 h-10 w-full rounded-xs font-semibold disabled:opacity-100 mobile:mt-7 mobile:h-15 mobile:rounded-full mobile:bg-linear-to-r mobile:from-primary mobile:to-[#b77943]"
                    >
                      Conectar e finalizar
                    </Button>
                  ) : (
                    <Button
                      asChild
                      disabled={!canConnect}
                      className="mt-5 h-10 w-full rounded-xs font-semibold mobile:mt-7 mobile:h-15 mobile:rounded-full mobile:bg-linear-to-r mobile:from-primary mobile:to-[#b77943]"
                    >
                      <Link
                        to="/login"
                        search={{ redirect: '/carrinho' }}
                        onClick={(event) => {
                          if (!canConnect) event.preventDefault()
                        }}
                        aria-disabled={!canConnect}
                        tabIndex={canConnect ? undefined : -1}
                      >
                        Conectar e finalizar
                      </Link>
                    </Button>
                  )}
                  <Link
                    to="/"
                    hash="catalogo"
                    className="mt-3 block text-center text-[14px] text-primary mobile:hidden"
                  >
                    Continuar explorando
                  </Link>
                </>
              )
            )}
          </section>
        </div>
      )}
      {cart.message && (
        <p
          id="cart-error"
          role="alert"
          className="mt-4 text-sm text-destructive mobile:px-7"
        >
          {cart.message}
        </p>
      )}
      {cart.query.isError && data && (
        <p role="status" className="mt-4 text-sm text-primary mobile:px-7">
          Não foi possível atualizar os valores do carrinho.{' '}
          <Button
            variant="link"
            onClick={() => {
              void cart.query.refetch()
            }}
          >
            Atualizar valores
          </Button>
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {cart.pending
          ? 'Atualizando carrinho.'
          : cart.mutation.isSuccess
            ? 'Carrinho atualizado.'
            : ''}
      </p>
      {data && (
        <NftRecommendations
          id={data.items[0]?.nftId ?? 'emerald-ape-042'}
          title="Colecionadores também viram"
        />
      )}
    </div>
  )
}
