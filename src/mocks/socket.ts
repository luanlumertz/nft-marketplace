import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdated } from '@/features/nfts/contracts'
import { env } from '@/lib/env'

// MSW 2.15 remove o prefixo /socket.io/ antes de comparar a URL do handler.
// O cliente continua usando o path Socket.IO padrao /socket.io/.
const socketUrl = new URL('/', env.socketUrl)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'

const socketEndpoint = ws.link(socketUrl.href)
const subscribers = new Set<ReturnType<typeof toSocketIo>>()

export const socketHandler = socketEndpoint.addEventListener('connection', (connection) => {
  const socket = toSocketIo(connection)
  socket.client.on('catalog.subscribe', () => subscribers.add(socket))

  // O binding 0.2 fornece handshake e frames. O mock fornece o heartbeat do Engine.IO.
  const heartbeat = window.setInterval(() => connection.client.send('2'), 20_000)
  connection.client.addEventListener('close', () => {
    window.clearInterval(heartbeat)
    subscribers.delete(socket)
  })
})

export function broadcastNftUpdated(event: NftUpdated) {
  for (const socket of subscribers) socket.client.emit('nft.updated', event)
}

export function subscriberCount() {
  return subscribers.size
}
