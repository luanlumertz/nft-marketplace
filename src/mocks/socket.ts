import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdated } from '@/features/nfts/contracts'
import { env } from '@/lib/env'
import { accounts } from './accounts'
import type { OrderUpdated } from '@/features/checkout/contracts'

// MSW 2.15 remove o prefixo /socket.io/ antes de comparar a URL do handler.
// O cliente continua usando o path Socket.IO padrao /socket.io/.
const socketUrl = new URL('/', env.socketUrl)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'

const socketEndpoint = ws.link(socketUrl.href)
const subscribers = new Set<ReturnType<typeof toSocketIo>>()
const orderSubscribers = new Map<
  ReturnType<typeof toSocketIo>,
  { token: string; close: () => void }
>()
let ordersOnline = true

export const socketHandler = socketEndpoint.addEventListener(
  'connection',
  (connection) => {
    const socket = toSocketIo(connection)
    socket.client.on('catalog.subscribe', () => subscribers.add(socket))
    socket.client.on(
      'orders.subscribe',
      (_event, input: { token?: string }) => {
        if (!ordersOnline || !input?.token || !accounts.session(input.token)) {
          connection.client.close(1013, 'Sessão indisponível')
          return
        }
        orderSubscribers.set(socket, {
          token: input.token,
          close: () => connection.client.close(1012, 'Reconectando'),
        })
      },
    )

    // O binding 0.2 fornece handshake e frames. O mock fornece o heartbeat do Engine.IO.
    const heartbeat = window.setInterval(
      () => connection.client.send('2'),
      20_000,
    )
    connection.client.addEventListener('close', () => {
      window.clearInterval(heartbeat)
      subscribers.delete(socket)
      orderSubscribers.delete(socket)
    })
  },
)

export function broadcastNftUpdated(event: NftUpdated) {
  for (const socket of subscribers) socket.client.emit('nft.updated', event)
}

export function subscriberCount() {
  return subscribers.size
}
export function broadcastOrderUpdated(event: OrderUpdated) {
  for (const [socket, subscriber] of orderSubscribers)
    if (accounts.session(subscriber.token)?.user.id === event.userId)
      socket.client.emit('order.updated', event)
}
export function orderSubscriberCount() {
  return orderSubscribers.size
}
export function setOrdersOnline(online: boolean) {
  ordersOnline = online
  if (!online)
    for (const subscriber of orderSubscribers.values()) subscriber.close()
}
