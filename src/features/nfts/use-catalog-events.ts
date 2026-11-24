import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { env } from '@/lib/env'
import { nftUpdatedSchema, type Nft, type NftList, type ServerToClientEvents, type ClientToServerEvents } from './contracts'
import { nftKeys } from './queries'

export function useCatalogEvents() {
  const queryClient = useQueryClient()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(env.socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
    })

    const onConnect = () => {
      socket.emit('catalog.subscribe')
      // REST reconcilia o estado mesmo se algum evento foi perdido na desconexao.
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
    }

    const onNftUpdated = (payload: unknown) => {
      const parsed = nftUpdatedSchema.safeParse(payload)
      if (!parsed.success) return
      const { data: nft } = parsed.data
      let changed = false

      queryClient.setQueriesData<NftList>({ queryKey: nftKeys.list() }, (current) => {
        if (!current) return current
        return {
          ...current,
          items: current.items.map((item) => {
            if (item.id !== nft.id || item.version >= nft.version) return item
            changed = true
            return nft
          }),
        }
      })
      queryClient.setQueryData<Nft>(nftKeys.detail(nft.id), (current) => {
        if (!current || current.version >= nft.version) return current
        changed = true
        return nft
      })

      if (changed) setAnnouncement(`Preço ou disponibilidade de ${nft.name} atualizado.`)
    }

    socket.on('connect', onConnect)
    socket.on('nft.updated', onNftUpdated)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('nft.updated', onNftUpdated)
      socket.disconnect()
    }
  }, [queryClient])

  return announcement
}
