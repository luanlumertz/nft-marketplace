import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { env } from '@/lib/env'
import { getSessionToken } from '@/lib/credentials'
import { useSession } from '@/features/auth/session'
import { isCartKey } from '@/features/cart/use-cart'
import { orderUpdatedSchema, type OrderUpdated } from './contracts'
import { orderKeys } from './queries'

export function useOrderEvents() {
  const client = useQueryClient(),
    session = useSession()
  const userId = session.data?.user?.id,
    token = getSessionToken()
  const [online, setOnline] = useState(false)
  useEffect(() => {
    if (!userId || !token) return
    let disposed = false
    const versions = new Map<string, number>()
    const current = () => !disposed && token === getSessionToken()
    const socket: Socket<
      { 'order.updated': (event: OrderUpdated) => void },
      { 'orders.subscribe': (input: { token: string }) => void }
    > = io(env.socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 500,
    })
    const reconcile = () => {
      if (!current()) return
      void client.invalidateQueries({ queryKey: orderKeys.all(userId) })
      void client.invalidateQueries({
        predicate: (query) => isCartKey(query.queryKey),
      })
    }
    const connect = () => {
      if (current()) {
        socket.emit('orders.subscribe', { token })
        setOnline(true)
        reconcile()
      }
    }
    const disconnect = () => {
      if (current()) setOnline(false)
    }
    const update = (payload: unknown) => {
      const parsed = orderUpdatedSchema.safeParse(payload)
      if (!current() || !parsed.success || parsed.data.userId !== userId) return
      const event = parsed.data
      if (event.version <= (versions.get(event.resourceId) ?? 0)) return
      versions.set(event.resourceId, event.version)
      // O evento invalida; o snapshot autorizado e o estado terminal vêm da REST.
      reconcile()
    }
    socket.on('connect', connect)
    socket.on('disconnect', disconnect)
    socket.on('order.updated', update)
    socket.connect()
    return () => {
      disposed = true
      socket.off('connect', connect)
      socket.off('disconnect', disconnect)
      socket.off('order.updated', update)
      socket.disconnect()
    }
  }, [client, userId, token])
  return online
}
