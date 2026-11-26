import { accounts } from './accounts'
import { carts } from './carts'
import { commerce } from './commerce-store'
import { mockStore } from './store'
import { broadcastOrderUpdated, broadcastNftUpdated } from './socket'
import type {
  ConnectionInput,
  Order,
  OrderInput,
  OrderUpdated,
} from '@/features/checkout/contracts'
import { walletFieldsSchema } from '@/features/account/contracts'

export class CheckoutFailure extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
const fail = (status: number, code: string, message: string): never => {
  throw new CheckoutFailure(status, code, message)
}
const timers = new Map<string, number>()
function event(order: Order): OrderUpdated {
  return {
    eventId: crypto.randomUUID(),
    resourceId: order.id,
    userId: order.userId,
    version: order.version,
    status: order.status,
  }
}
function settle(id: string, outcome?: 'confirmed' | 'declined') {
  const current = commerce.read().orders[id]
  if (!current || current.order.status !== 'pending') return current?.order
  const order = commerce.change((draft) => {
    const saved = draft.orders[id]
    const order = saved.order
    order.status = outcome ?? saved.outcome
    order.version++
    order.settledAt = Date.now()
    saved.dueAt = null
    if (order.status === 'confirmed') {
      for (const item of order.cart.items) {
        const stock = (draft.inventory[item.nftId] ??= {
          sold: 0,
          version: 0,
          editions: {},
        })
        stock.sold += item.quantity
        stock.editions[item.editionId] =
          (stock.editions[item.editionId] ?? 0) + item.quantity
      }
      for (const nftId of new Set(order.cart.items.map((item) => item.nftId)))
        draft.inventory[nftId].version++
      order.transactionId = `0x${(crypto.randomUUID() + crypto.randomUUID()).replaceAll('-', '')}`
      const cart = draft.carts[`user:${order.userId}`]
      if (cart) {
        for (const bought of order.cart.items) {
          const item = cart.items.find(
            (item) =>
              item.nftId === bought.nftId &&
              item.editionId === bought.editionId,
          )
          if (item) item.quantity = Math.max(0, item.quantity - bought.quantity)
        }
        cart.items = cart.items.filter((item) => item.quantity > 0)
        cart.revision++
        if (!cart.items.length) cart.coupon = null
      }
    } else
      order.reason =
        'Pagamento recusado. Os itens foram preservados no seu carrinho.'
    return structuredClone(order)
  })
  broadcastOrderUpdated(event(order))
  if (order.status === 'confirmed') {
    for (const nftId of new Set(order.cart.items.map((item) => item.nftId))) {
      const nft = mockStore.getState().nfts.find((nft) => nft.id === nftId)
      if (nft)
        broadcastNftUpdated({
          eventId: crypto.randomUUID(),
          resourceId: nftId,
          version: nft.version,
          data: nft,
        })
    }
  }
  return order
}
function arm() {
  for (const { order, dueAt } of Object.values(commerce.read().orders)) {
    if (order.status !== 'pending' || dueAt === null || timers.has(order.id))
      continue
    const timer = window.setTimeout(
      () => {
        timers.delete(order.id)
        try {
          settle(order.id)
        } catch {
          /* A consulta REST recupera a finalização se a persistência falhar. */
        }
      },
      Math.max(0, dueAt - Date.now()),
    )
    timers.set(order.id, timer)
  }
}
function reconcile() {
  for (const { order, dueAt } of Object.values(commerce.read().orders))
    if (order.status === 'pending' && dueAt !== null && dueAt <= Date.now())
      settle(order.id)
  arm()
}
export const orders = {
  connect(userId: string, token: string, input: ConnectionInput) {
    const wallet = accounts
      .wallets(userId)
      .items.find((wallet) => wallet.id === input.walletId)
    if (!wallet)
      return fail(
        404,
        'WALLET_NOT_FOUND',
        'Cadastre ou selecione uma carteira disponível.',
      )
    if (wallet.network !== input.network)
      return fail(
        409,
        'NETWORK_MISMATCH',
        'Selecione a rede cadastrada nesta carteira.',
      )
    if (mockStore.getState().scenario === 'wallet-rejected')
      return fail(
        422,
        'CONNECTION_REJECTED',
        'A conexão foi recusada pela carteira. Tente novamente.',
      )
    const connection = {
      ...input,
      id: crypto.randomUUID(),
      address: wallet.address,
      expiresAt: Date.now() + 30 * 60_000,
    }
    commerce.change((draft) => {
      for (const [id, saved] of Object.entries(draft.connections))
        if (saved.token === token) delete draft.connections[id]
      draft.connections[connection.id] = { ...connection, userId, token }
    })
    return connection
  },
  connection(userId: string, token: string) {
    const found = Object.values(commerce.read().connections).find(
      (c) =>
        c.userId === userId && c.token === token && c.expiresAt > Date.now(),
    )
    if (!found) return null
    const wallet = accounts
      .wallets(userId)
      .items.find((wallet) => wallet.id === found.walletId)
    if (
      !wallet ||
      wallet.address !== found.address ||
      wallet.network !== found.network
    )
      return null
    const { id, address, expiresAt, walletId, network, provider } = found
    return { id, address, expiresAt, walletId, network, provider }
  },
  disconnect(userId: string, id: string) {
    commerce.change((draft) => {
      if (draft.connections[id]?.userId === userId) delete draft.connections[id]
    })
  },
  create(userId: string, token: string, attemptId: string, input: OrderInput) {
    reconcile()
    const existing = Object.values(commerce.read().orders).find(
      (saved) =>
        saved.order.userId === userId && saved.order.attemptId === attemptId,
    )
    if (existing) {
      if (JSON.stringify(existing.input) !== JSON.stringify(input))
        return fail(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Esta tentativa já foi usada com outros dados. Recupere o pedido original.',
        )
      return structuredClone(existing.order)
    }
    const scenario = mockStore.getState().scenario
    const connection = commerce.read().connections[input.connectionId]
    const wallet = accounts
      .wallets(userId)
      .items.find((wallet) => wallet.id === connection?.walletId)
    if (
      !connection ||
      connection.userId !== userId ||
      connection.token !== token ||
      connection.expiresAt <= Date.now() ||
      scenario === 'wallet-disconnected'
    )
      return fail(
        409,
        'WALLET_DISCONNECTED',
        'Sua carteira foi desconectada. Conecte novamente para continuar.',
      )
    if (
      !wallet ||
      wallet.address !== connection.address ||
      wallet.network !== connection.network
    )
      return fail(
        409,
        'WALLET_CHANGED',
        'A carteira foi alterada. Selecione e conecte novamente.',
      )
    const checkedWallet = walletFieldsSchema.safeParse({
      ...wallet,
      secondaryAddress: input.collector.secondaryAddress,
    })
    if (!checkedWallet.success)
      return fail(
        422,
        'INVALID_ADDRESS',
        'Confira o endereço da carteira secundária.',
      )
    const cart = carts.snapshot(`user:${userId}`)
    if (!cart.quote.canCheckout)
      return fail(
        409,
        'CART_CONFLICT',
        'Disponibilidade ou cupom alterado. Revise o carrinho antes de continuar.',
      )
    if (cart.quote.version !== input.quoteVersion)
      return fail(
        409,
        'QUOTE_CHANGED',
        'Os valores mudaram. Revise a nova cotação e confirme novamente.',
      )
    const pending = Object.values(commerce.read().orders)
      .filter((saved) => saved.order.status === 'pending')
      .flatMap((saved) => saved.order.cart.items)
    for (const item of cart.items) {
      const held = pending
        .filter(
          (held) =>
            held.nftId === item.nftId && held.editionId === item.editionId,
        )
        .reduce((sum, held) => sum + held.quantity, 0)
      if (item.quantity + held > item.available)
        return fail(
          409,
          'CART_CONFLICT',
          'Esta edição já está reservada em um pedido pendente. Aguarde a conclusão ou revise o carrinho.',
        )
    }
    for (const nftId of new Set(cart.items.map((item) => item.nftId))) {
      const available =
        mockStore.getState().nfts.find((nft) => nft.id === nftId)?.available ??
        0
      const total = [...pending, ...cart.items]
        .filter((item) => item.nftId === nftId)
        .reduce((sum, item) => sum + item.quantity, 0)
      if (total > available)
        return fail(
          409,
          'CART_CONFLICT',
          'A disponibilidade mudou ou está reservada. Revise as quantidades no carrinho.',
        )
    }
    const order: Order = {
      id: crypto.randomUUID(),
      userId,
      attemptId,
      version: 1,
      status: 'pending',
      createdAt: Date.now(),
      settledAt: null,
      transactionId: null,
      reason: null,
      collector: input.collector,
      wallet: { ...wallet, provider: connection.provider },
      cart,
    }
    commerce.change((draft) => {
      draft.orders[order.id] = {
        order,
        input,
        dueAt: scenario === 'order-pending' ? null : Date.now() + 1800,
        outcome: scenario === 'payment-declined' ? 'declined' : 'confirmed',
      }
    })
    arm()
    broadcastOrderUpdated(event(order))
    return structuredClone(order)
  },
  find(userId: string, id: string) {
    reconcile()
    const found = commerce.read().orders[id]?.order
    return found?.userId === userId ? structuredClone(found) : null
  },
  attempt(userId: string, attemptId: string) {
    reconcile()
    const found = Object.values(commerce.read().orders).find(
      (saved) =>
        saved.order.userId === userId && saved.order.attemptId === attemptId,
    )
    return found ? structuredClone(found.order) : null
  },
  reconcile,
  settle,
  event,
  resetTimers() {
    for (const timer of timers.values()) window.clearTimeout(timer)
    timers.clear()
  },
}
