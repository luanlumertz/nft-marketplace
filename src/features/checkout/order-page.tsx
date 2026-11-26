import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { MailOpen, LoaderCircle, CircleX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/session'
import { walletNetworks } from '@/features/account/contracts'
import { orderOptions } from './queries'
import { useOrderEvents } from './use-order-events'
import { OrderItems, OrderTotals } from './order-summary'
import { readAttempt, saveAttempt } from './attempt-storage'

export function OrderPage({ id }: { id: string }) {
  const session = useSession(),
    userId = session.data?.user?.id
  const query = useQuery({
    ...orderOptions(userId ?? 'anonymous', id),
    enabled: !!userId,
  })
  const online = useOrderEvents()
  const [explorer, setExplorer] = useState(false)
  const order = query.data?.userId === userId ? query.data : undefined
  useDocumentTitle(
    order?.status === 'confirmed'
      ? 'Pedido confirmado | Kurio'
      : 'Seu pedido | Kurio',
  )
  useEffect(() => {
    if (!userId || !order || order.status === 'pending') return
    if (readAttempt(userId)?.key === order.attemptId) saveAttempt(userId, null)
  }, [userId, order])
  if (!userId) return <p>Entre para consultar seu pedido.</p>
  if (query.isError && !order)
    return (
      <section role="alert" className="mx-auto max-w-145 py-20 text-center">
        <h1 className="text-xl font-semibold">
          {isAxiosError(query.error) && query.error.response?.status === 404
            ? 'Pedido não encontrado para esta conta'
            : 'Não foi possível consultar o pedido'}
        </h1>
        <Button
          className="mt-6"
          onClick={() => {
            void query.refetch()
          }}
        >
          Tentar novamente
        </Button>
        <Link to="/carrinho" className="mt-6 block text-primary">
          Voltar ao carrinho
        </Link>
      </section>
    )
  if (!order)
    return (
      <div
        role="status"
        aria-label="Carregando pedido"
        className="mx-auto max-w-145 py-12"
      >
        <Skeleton className="h-36" />
        <Skeleton className="mt-6 h-80" />
      </div>
    )
  const network = walletNetworks.find(
    ([key]) => key === order.wallet.network,
  )?.[1]
  if (order.status !== 'confirmed')
    return (
      <section
        className="mx-auto max-w-145 rounded-2xl border border-border bg-card px-7 py-12 text-center mobile:mt-8 mobile:rounded-3xl"
        aria-labelledby="order-status-title"
      >
        {order.status === 'pending' ? (
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto size-14 animate-spin text-primary motion-reduce:animate-none"
          />
        ) : (
          <CircleX
            aria-hidden="true"
            className="mx-auto size-14 text-primary"
          />
        )}
        <h1 id="order-status-title" className="mt-6 text-2xl font-semibold">
          {order.status === 'pending'
            ? 'Pedido em processamento'
            : 'Pagamento recusado'}
        </h1>
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {order.status === 'pending'
            ? 'Aguardando a confirmação do pagamento simulado. Você pode recarregar esta página para acompanhar o mesmo pedido.'
            : order.reason}
        </p>
        <p className="mt-5 text-xs break-all text-muted-foreground">
          Pedido: {order.id}
        </p>
        <p className="mt-4 text-xl font-semibold text-primary">
          {order.cart.quote.totalEth} ETH
        </p>
        {!online && (
          <p role="status" className="mt-5 text-sm text-primary">
            Conexão interrompida. Reconectando e recuperando o estado do pedido…
          </p>
        )}
        {query.isError && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            Não foi possível atualizar. Seu pedido continua salvo; tente
            consultar novamente.
          </p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {order.status === 'pending' ? (
            <Button
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch()
              }}
            >
              {query.isFetching ? 'Consultando…' : 'Verificar estado'}
            </Button>
          ) : (
            <Button asChild>
              <Link to="/pagamento">Tentar novamente</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </section>
    )
  return (
    <article
      className="relative mx-auto max-w-145 border-b-10 border-primary bg-[#251610] pt-6 pb-12 mobile:rounded-t-3xl mobile:pb-8"
      aria-labelledby="receipt-title"
    >
      <Link
        to="/"
        aria-label="Fechar recibo e voltar ao catálogo"
        className="absolute top-3 right-3 grid size-9 place-items-center text-primary"
      >
        <X size={18} />
      </Link>
      <MailOpen
        aria-hidden="true"
        className="mx-auto size-20 text-primary"
        strokeWidth={1.25}
      />
      <h1
        id="receipt-title"
        className="px-6 pt-4 pb-5 text-center text-[16px] font-semibold text-muted-foreground"
      >
        Seus NFTs agora estão na sua carteira
      </h1>
      <dl className="grid grid-cols-[1.1fr_1fr_1fr_0.8fr] divide-x divide-primary/70 border-y border-primary px-8 py-4 text-sm text-muted-foreground mobile:grid-cols-2 mobile:gap-3 mobile:divide-x-0 mobile:px-6 [&>div]:min-w-0 [&>div]:px-4 [&>div:first-child]:pl-0 [&>div:last-child]:pr-0 mobile:[&>div]:px-0">
        <div>
          <dt className="font-semibold">ID da transação</dt>
          <dd className="break-all">
            {order.transactionId?.slice(0, 8)}…{order.transactionId?.slice(-4)}
          </dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>
            {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
              .format(order.settledAt!)
              .replaceAll(' de ', ' ')
              .replace('.', '')}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="break-all">{order.cart.quote.totalEth} ETH</dd>
        </div>
        <div>
          <dt className="font-semibold">Carteira</dt>
          <dd className="break-words">
            {providersLabel(order.wallet.provider)}
          </dd>
        </div>
      </dl>
      <div className="px-11 pt-5 mobile:px-5">
        <h2 className="mb-2 text-[16px] font-semibold">
          Detalhes da transação
        </h2>
        <OrderItems cart={order.cart} receipt />
        <OrderTotals cart={order.cart} receipt />
        <p className="mt-5 border-t border-border pt-4 text-center text-sm leading-6 text-muted-foreground">
          Transação confirmada na {network}. A propriedade foi transferida para
          sua carteira conectada e registrada na rede nesta simulação.
        </p>
        <div className="mt-5 text-center">
          <Button
            type="button"
            className="h-12 rounded-xs font-semibold"
            onClick={() => setExplorer(!explorer)}
          >
            {explorer
              ? 'Ocultar transação'
              : order.wallet.network === 'ethereum'
                ? 'Ver no Etherscan'
                : 'Ver no explorador'}
          </Button>
        </div>
        {explorer && (
          <section
            aria-label="Explorador simulado"
            className="mt-5 rounded-lg border border-border p-4 text-sm"
          >
            <h3 className="font-semibold">Explorador simulado · {network}</h3>
            <p className="mt-2 break-all">{order.transactionId}</p>
            <p className="mt-2 text-muted-foreground">
              Referência local de demonstração, sem consulta à blockchain.
            </p>
          </section>
        )}
      </div>
    </article>
  )
}
function providersLabel(provider: string) {
  return provider === 'coinbase'
    ? 'Coinbase'
    : provider === 'walletconnect'
      ? 'WalletConnect'
      : 'MetaMask'
}
