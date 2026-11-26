import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { profileOptions, walletsOptions } from '@/features/account/queries'
import {
  walletNetworks,
  type Profile,
  type Wallets,
} from '@/features/account/contracts'
import {
  validationErrors,
  type FieldErrors,
} from '@/features/account/form-feedback'
import { useCart, isCartKey } from '@/features/cart/use-cart'
import type { Cart } from '@/features/cart/contracts'
import { useSession } from '@/features/auth/session'
import { getSessionToken } from '@/lib/credentials'
import { http } from '@/lib/http'
import {
  collectorSchema,
  connectionSchema,
  orderSchema,
  type Collector,
  type ConnectionInput,
  type WalletConnection,
} from './contracts'
import {
  attemptOptions,
  checkoutOptions,
  orderKeys,
  privateHeaders,
} from './queries'
import {
  readAttempt,
  readDraft,
  saveAttempt,
  type SavedAttempt,
} from './attempt-storage'
import { useOrderEvents } from './use-order-events'
import { CheckoutFields } from './checkout-fields'
import { OrderItems, OrderTotals } from './order-summary'

const providers = [
  ['walletconnect', 'WalletConnect', 'W'],
  ['metamask', 'MetaMask', 'M'],
  ['coinbase', 'Coinbase Wallet', 'C'],
] as const
const radioStyle =
  'size-4 shrink-0 appearance-none rounded-full border border-primary bg-transparent checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--card)]'
function message(error: unknown) {
  return isAxiosError(error)
    ? String(
        error.response?.data?.message ??
          'A resposta não chegou. Use Recuperar pedido para consultar a mesma tentativa.',
      )
    : error instanceof Error
      ? error.message
      : ''
}
function CheckoutForm({
  userId,
  profile,
  wallets,
  cart,
  initialConnection,
  refreshing,
  refreshFailed,
}: {
  userId: string
  profile: Profile
  wallets: Wallets
  cart: Cart
  initialConnection: WalletConnection | null
  refreshing: boolean
  refreshFailed: boolean
}) {
  const [saved] = useState(() => readDraft(userId))
  const initialWallet =
    wallets.items.find((w) => w.id === saved?.walletId) ??
    wallets.items.find((w) => w.slot === 'primary') ??
    wallets.items[0]
  const [selection, setSelection] = useState<
    Omit<ConnectionInput, 'provider'> & {
      provider: ConnectionInput['provider'] | ''
    }
  >(() => ({
    walletId: initialWallet?.id ?? '',
    network: initialWallet?.network ?? saved?.network ?? 'ethereum',
    provider: saved?.providerSelected ? saved.provider : '',
  }))
  const [collector, setCollector] = useState<Collector>(() => ({
    name: profile.name,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    profileName: initialWallet?.profileName ?? profile.username,
    referralCode: initialWallet?.referralCode ?? '',
    secondaryAddress: initialWallet?.secondaryAddress ?? '',
    notes: '',
    ...saved?.collector,
  }))
  const [connection, setConnection] = useState(initialConnection)
  const [otherWallet, setOtherWallet] = useState(
    initialWallet?.slot === 'secondary',
  )
  const reviewedCollector = useRef<Collector | null>(null)
  const preparing = useRef(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [review, setReview] = useState<Cart | null>(null)
  const [attempt, setAttempt] = useState<SavedAttempt | null>(() =>
    readAttempt(userId),
  )
  const [recoverOnMount] = useState(() => !!readAttempt(userId))
  const [notice, setNotice] = useState('')
  const [draftError, setDraftError] = useState('')
  const confirmButton = useRef<HTMLButtonElement>(null)
  const form = useRef<HTMLFormElement>(null),
    sending = useRef(false)
  const navigate = useNavigate(),
    client = useQueryClient()
  const wallet = wallets.items.find((w) => w.id === selection.walletId)
  const connected =
    connection &&
    connection.walletId === selection.walletId &&
    connection.network === selection.network &&
    connection.provider === selection.provider
      ? connection
      : null
  const lookup = useQuery({
    ...attemptOptions(userId, attempt?.key ?? ''),
    enabled: !!attempt && recoverOnMount,
  })
  useOrderEvents()
  const current = (token: string | null) =>
    token !== null && token === getSessionToken()
  useEffect(() => {
    if (!connection) return
    const timer = window.setTimeout(
      () => setConnection(null),
      Math.max(0, connection.expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [connection])
  useEffect(() => {
    try {
      localStorage.setItem(
        `kurio:checkout:${userId}`,
        JSON.stringify({
          ...selection,
          providerSelected: selection.provider !== '',
          collector,
        }),
      )
    } catch {
      /* O envio informa a falha antes de criar uma tentativa sem persistência. */
    }
  }, [userId, selection, collector])
  useEffect(() => {
    if (lookup.data?.order && lookup.data.order.userId === userId)
      void navigate({
        to: '/pedidos/$orderId',
        params: { orderId: lookup.data.order.id },
        replace: true,
      })
  }, [lookup.data, userId, navigate])
  const connect = useMutation({
    mutationFn: async ({
      input,
      token,
    }: {
      input: ConnectionInput
      token: string | null
    }) =>
      connectionSchema.parse(
        (
          await http.post('/wallet-connections', input, {
            headers: privateHeaders(token),
          })
        ).data,
      ),
    onSuccess: (value, { token }) => {
      if (current(token)) {
        setConnection(value)
        setNotice('')
        client.setQueryData(orderKeys.checkout(userId), { connection: value })
      }
    },
  })
  const disconnect = useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string | null }) => {
      await http.delete(`/wallet-connections/${id}`, {
        headers: privateHeaders(token),
      })
    },
    onSuccess: (_, { token }) => {
      if (current(token)) {
        setConnection(null)
        setNotice('')
        client.setQueryData(orderKeys.checkout(userId), { connection: null })
      }
    },
  })
  const create = useMutation({
    mutationFn: async ({
      saved,
      token,
    }: {
      saved: SavedAttempt
      token: string | null
    }) => {
      if (!current(token))
        throw new Error('Entre novamente para retomar o pedido.')
      return orderSchema.parse(
        (
          await http.post('/orders', saved.input, {
            timeout: 4500,
            headers: { ...privateHeaders(token), 'Idempotency-Key': saved.key },
          })
        ).data,
      )
    },
    onSuccess: async (order, { token }) => {
      if (!current(token)) return
      client.setQueryData(orderKeys.detail(userId, order.id), order)
      await navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
    },
    onError: (error, { token }) => {
      if (!current(token)) return
      const code = isAxiosError(error) ? error.response?.data?.code : undefined
      if (
        [
          'QUOTE_CHANGED',
          'CART_CONFLICT',
          'WALLET_DISCONNECTED',
          'WALLET_CHANGED',
          'INVALID_ADDRESS',
          'VALIDATION_ERROR',
        ].includes(code)
      ) {
        saveAttempt(userId, null)
        setAttempt(null)
        setReview(null)
        if (code.startsWith('WALLET_')) setConnection(null)
        if (isAxiosError(error))
          setErrors(error.response?.data?.fieldErrors ?? {})
        void client.invalidateQueries({
          predicate: (q) => isCartKey(q.queryKey),
        })
      }
      setNotice(message(error))
    },
    onSettled: () => {
      sending.current = false
    },
  })
  const busy = create.isPending || connect.isPending || disconnect.isPending
  function change(key: keyof Collector, value: string) {
    setCollector((c) => ({ ...c, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    setReview(null)
  }
  function choose(id: string) {
    const next = wallets.items.find((w) => w.id === id)
    if (!next) return
    setSelection({
      walletId: id,
      network: next.network,
      provider: selection.provider,
    })
    setCollector((c) => ({
      ...c,
      profileName: next.profileName,
      referralCode: next.referralCode,
      secondaryAddress: next.secondaryAddress,
    }))
    connect.reset()
    disconnect.reset()
    if (connection) {
      disconnect.mutate({ id: connection.id, token: getSessionToken() })
      setConnection(null)
    }
    setReview(null)
    setNotice('')
  }
  async function validate(event: FormEvent) {
    event.preventDefault()
    if (
      busy ||
      preparing.current ||
      refreshing ||
      refreshFailed ||
      !cart.quote.canCheckout ||
      attempt ||
      !wallet ||
      !selection.provider
    )
      return
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const candidate = mobile
      ? {
          name: profile.name,
          username: profile.username,
          email: profile.email,
          ensName: profile.ensName,
          profileName: wallet.profileName,
          referralCode: wallet.referralCode,
          secondaryAddress: wallet.secondaryAddress,
          notes: '',
        }
      : collector
    const parsed = collectorSchema.safeParse(candidate)
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error))
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      )
      return
    }
    preparing.current = true
    const token = getSessionToken()
    try {
      if (!connected)
        await connect.mutateAsync({
          input: { ...selection, provider: selection.provider },
          token,
        })
      if (!current(token)) return
      reviewedCollector.current = parsed.data
      setErrors({})
      setNotice('')
      setReview(structuredClone(cart))
    } catch (error) {
      if (current(token)) setNotice(message(error))
    } finally {
      preparing.current = false
    }
  }
  function send() {
    if (sending.current || !review || !connected || refreshing || refreshFailed)
      return
    if (review.quote.version !== cart.quote.version) {
      setReview(null)
      setNotice(
        'Os valores mudaram. Revise a nova cotação e confirme novamente.',
      )
      return
    }
    const parsed = collectorSchema.safeParse(reviewedCollector.current)
    if (!parsed.success) return
    const saved: SavedAttempt = {
      key: crypto.randomUUID(),
      input: {
        quoteVersion: review.quote.version,
        connectionId: connected.id,
        collector: parsed.data,
      },
    }
    try {
      saveAttempt(userId, saved)
    } catch {
      setDraftError(
        'Não foi possível guardar a tentativa neste navegador. Libere espaço e tente novamente.',
      )
      return
    }
    sending.current = true
    setAttempt(saved)
    setReview(null)
    create.mutate({ saved, token: getSessionToken() })
  }
  async function recover() {
    if (!attempt || sending.current || create.isPending) return
    sending.current = true
    setNotice('')
    const token = getSessionToken()
    try {
      const result = await client.fetchQuery({
        ...attemptOptions(userId, attempt.key),
        staleTime: 0,
      })
      if (!current(token)) {
        sending.current = false
        return
      }
      if (result.order) {
        sending.current = false
        await navigate({
          to: '/pedidos/$orderId',
          params: { orderId: result.order.id },
        })
      } else create.mutate({ saved: attempt, token })
    } catch (error) {
      sending.current = false
      setNotice(message(error))
    }
  }
  const picker = (
    <fieldset
      disabled={busy || !!attempt}
      className="hidden space-y-4 mobile:block"
    >
      <legend className="mb-3 w-full">
        <span className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold">Carteira conectada</span>
          <button
            type="button"
            disabled={wallets.items.length < 2 || busy || !!attempt}
            onClick={() => {
              const index = wallets.items.findIndex(
                (w) => w.id === selection.walletId,
              )
              choose(wallets.items[(index + 1) % wallets.items.length].id)
            }}
            className="min-h-8 text-sm font-semibold text-primary disabled:opacity-50"
          >
            Trocar carteira
          </button>
        </span>
      </legend>
      <div className="hidden mobile:block mobile:space-y-5">
        {wallets.items.map((w) => (
          <label
            key={w.id}
            className="flex cursor-pointer items-center gap-4 rounded-2xl bg-card p-5"
          >
            <input
              type="radio"
              name="saved-wallet"
              checked={selection.walletId === w.id}
              onChange={() => choose(w.id)}
              className={radioStyle}
            />
            <span className="min-w-0">
              <strong className="block text-[16px]">{w.walletAlias}</strong>
              <span className="mt-1 block text-sm break-all text-muted-foreground">
                {w.ensName || w.address}
              </span>
              <span className="block text-sm text-muted-foreground">
                Rede {walletNetworks.find(([key]) => key === w.network)?.[1]}
              </span>
            </span>
          </label>
        ))}
      </div>
      {!wallets.items.length && (
        <p className="text-sm text-muted-foreground">
          Você ainda não cadastrou uma carteira.
        </p>
      )}
      {!wallets.items.length && (
        <Link
          to="/carteiras"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Cadastrar carteira
        </Link>
      )}
    </fieldset>
  )
  return (
    <>
      <form
        ref={form}
        noValidate
        onSubmit={validate}
        aria-label="Pagamento"
        className="grid grid-cols-[minmax(0,1.88fr)_minmax(0,1fr)] items-start gap-8 tablet:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] tablet:gap-6 mobile:flex mobile:flex-1 mobile:flex-col mobile:gap-7"
      >
        <section className="min-w-0 mobile:w-full">
          <h2 className="mb-5 text-lg font-semibold mobile:hidden">
            Perfil do colecionador
          </h2>
          {picker}
          <fieldset disabled={busy || !!attempt} className="mobile:hidden">
            <CheckoutFields
              collector={collector}
              wallet={wallet}
              network={selection.network}
              provider={selection.provider}
              errors={errors}
              change={change}
              changeNetwork={(network) => {
                setSelection((old) => ({ ...old, network }))
                setReview(null)
              }}
              walletSwitch={
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={otherWallet}
                      disabled={wallets.items.length < 2}
                      className={radioStyle}
                      onChange={(event) => {
                        setOtherWallet(event.target.checked)
                        if (!event.target.checked) {
                          const primary = wallets.items.find(
                            (w) => w.slot === 'primary',
                          )
                          if (primary) choose(primary.id)
                        }
                      }}
                    />
                    Usar outra carteira?
                  </label>
                  {!wallets.items.length && (
                    <Link
                      to="/carteiras"
                      className="text-sm text-primary underline"
                    >
                      Cadastrar carteira
                    </Link>
                  )}
                  {otherWallet && (
                    <select
                      aria-label="Carteira cadastrada"
                      value={selection.walletId}
                      onChange={(event) => choose(event.target.value)}
                      className="h-10 w-60 max-w-full rounded-xs border border-border bg-background px-2 pr-8 text-sm"
                    >
                      {wallets.items.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.walletAlias} · {w.network}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              }
            />
          </fieldset>
        </section>
        <aside className="min-w-0 mobile:flex mobile:w-full mobile:flex-1 mobile:flex-col">
          <div className="mobile:hidden">
            <h2 className="mb-2 text-lg font-semibold">Seus NFTs</h2>
            <OrderItems cart={cart} />
            <Link
              to="/carrinho"
              className="mt-3 block text-center text-sm text-foreground"
            >
              Tem um código promocional? Aplique aqui
            </Link>
            <OrderTotals cart={cart} />
          </div>
          <fieldset
            disabled={busy || !!attempt}
            className="mt-4 space-y-4 mobile:order-1 mobile:mt-0"
          >
            <legend className="mb-3 w-full text-center text-[18px] font-semibold mobile:text-left mobile:text-[16px]">
              Carteira e rede
            </legend>
            {providers.map(([value, label, icon]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xs border border-border px-3 py-2 has-checked:border-primary mobile:min-h-16 mobile:rounded-2xl mobile:border-0 mobile:bg-card mobile:px-4"
              >
                <input
                  type="radio"
                  name="provider"
                  checked={selection.provider === value}
                  onChange={() => {
                    setSelection((s) => ({ ...s, provider: value }))
                    setReview(null)
                    connect.reset()
                    if (connection) {
                      disconnect.mutate({
                        id: connection.id,
                        token: getSessionToken(),
                      })
                      setConnection(null)
                    }
                  }}
                  className={`${radioStyle} mobile:order-3 mobile:ml-auto`}
                />
                <span
                  aria-hidden="true"
                  className="hidden size-10 place-items-center rounded-full border border-border text-primary mobile:grid"
                >
                  {icon}
                </span>
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </fieldset>
          <p className="mt-4 hidden text-right text-[18px] font-semibold mobile:order-2 mobile:block">
            Total:{' '}
            <span className="text-primary">{cart.quote.totalEth} ETH</span>
          </p>
          <div className="mt-5 mobile:order-3 mobile:mt-auto mobile:pt-8">
            {(notice ||
              connect.isError ||
              disconnect.isError ||
              draftError) && (
              <p role="alert" className="mb-4 text-sm text-primary">
                {draftError ||
                  notice ||
                  message(connect.error ?? disconnect.error)}
              </p>
            )}
            {Object.values(errors).some(Boolean) && (
              <p role="alert" className="mb-4 text-sm text-destructive">
                Confira os campos destacados.
              </p>
            )}
            {refreshFailed && (
              <p role="alert" className="mb-4 text-sm text-destructive">
                Não foi possível atualizar a cotação. Recarregue os valores
                antes de confirmar.
              </p>
            )}
            {!cart.quote.canCheckout && (
              <p role="alert" className="mb-4 text-sm text-primary">
                Revise a disponibilidade e o cupom no{' '}
                <Link to="/carrinho" className="underline">
                  carrinho
                </Link>
                .
              </p>
            )}
            {attempt ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Existe uma tentativa de compra em andamento. Recupere o pedido
                  para continuar com segurança.
                </p>
                <Button
                  type="button"
                  disabled={create.isPending || lookup.isFetching}
                  onClick={() => {
                    void recover()
                  }}
                  className="h-12 w-full mobile:rounded-full"
                >
                  {create.isPending ? 'Enviando pedido…' : 'Recuperar pedido'}
                </Button>
                {lookup.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    Não foi possível consultar o pedido. Tente recuperar
                    novamente.
                  </p>
                )}
              </div>
            ) : (
              <Button
                type="submit"
                ref={confirmButton}
                disabled={
                  busy ||
                  refreshing ||
                  refreshFailed ||
                  !cart.quote.canCheckout ||
                  !wallet ||
                  !selection.provider
                }
                className="h-11 w-full rounded-xs font-semibold mobile:h-15 mobile:rounded-full mobile:bg-linear-to-r mobile:from-primary mobile:to-[#b77943]"
              >
                Confirmar compra
              </Button>
            )}
          </div>
        </aside>
      </form>
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null)
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            const target =
              confirmButton.current ?? document.getElementById('conteudo')
            target?.focus({ preventScroll: true })
          }}
          aria-describedby="purchase-review-description"
          className="fixed top-1/2 left-1/2 z-81 max-h-[90dvh] w-[min(560px,calc(100%-32px))] -translate-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6"
        >
          <DialogTitle className="text-xl font-semibold">
            Revisar compra
          </DialogTitle>
          <DialogDescription
            id="purchase-review-description"
            className="mt-3 text-sm text-muted-foreground"
          >
            Confira os itens, a carteira e o total antes de enviar o pedido.
          </DialogDescription>
          {review && (
            <>
              <p className="mt-4 text-sm break-all">
                {wallet?.walletAlias} · {selection.network}
                <br />
                {wallet?.address}
              </p>
              <div className="mt-4">
                <OrderItems cart={review} />
                <OrderTotals cart={review} />
              </div>
            </>
          )}
          {review?.quote.version !== cart.quote.version && (
            <p role="alert" className="mt-4 text-sm text-primary">
              Os valores mudaram. Volte e revise a nova cotação.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Voltar à revisão
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={send}
              disabled={
                busy ||
                refreshing ||
                refreshFailed ||
                review?.quote.version !== cart.quote.version
              }
            >
              Confirmar e enviar pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
export function CheckoutPage() {
  const session = useSession(),
    user = session.data?.user
  const cart = useCart()
  const profile = useQuery({
    ...profileOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  const wallets = useQuery({
    ...walletsOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  const checkout = useQuery({
    ...checkoutOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  useEffect(() => {
    const old = document.title
    document.title = 'Pagamento | Kurio'
    return () => {
      document.title = old
    }
  }, [])
  const queries = [cart.query, profile, wallets, checkout]
  const error = queries.some((q) => q.isError && !q.data)
  const ready =
    !!cart.query.data && !!profile.data && !!wallets.data && !!checkout.data
  return (
    <div className="mobile:flex mobile:min-h-svh mobile:flex-col mobile:px-7 mobile:pb-8">
      <nav
        aria-label="Caminho de navegação"
        className="mb-7 flex gap-2 text-sm font-semibold mobile:hidden"
      >
        <Link to="/">Início</Link>
        <span>/</span>
        <Link to="/carrinho">Mercado</Link>
        <span>/</span>
        <span aria-current="page">Pagamento</span>
      </nav>
      <header className="relative mb-7 hidden min-h-17 items-center justify-center mobile:flex">
        <Link
          to="/carrinho"
          aria-label="Voltar ao carrinho"
          className="absolute left-0 grid size-9 place-items-center rounded-full border border-border bg-card text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="pl-10 text-[18px] font-semibold">
          Pagamento com carteira
        </h1>
      </header>
      <h1 className="sr-only mobile:hidden">Pagamento</h1>
      {!user ? (
        <p>Entre para continuar o pagamento.</p>
      ) : error ? (
        <section role="alert">
          <p>Não foi possível carregar o pagamento.</p>
          <Button
            className="mt-4"
            onClick={() => {
              for (const query of queries) void query.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      ) : !ready ? (
        <div
          role="status"
          aria-label="Carregando pagamento"
          className="grid grid-cols-2 gap-7 mobile:grid-cols-1"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !cart.query.data!.items.length && !readAttempt(user.id) ? (
        <section className="grid min-h-80 place-content-center gap-5 text-center">
          <h2 className="text-xl">Seu carrinho está vazio</h2>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        </section>
      ) : (
        <CheckoutForm
          key={user.id}
          userId={user.id}
          profile={profile.data!}
          wallets={wallets.data!}
          cart={cart.query.data!}
          initialConnection={checkout.data!.connection}
          refreshing={cart.query.isFetching}
          refreshFailed={cart.query.isError}
        />
      )}
    </div>
  )
}
