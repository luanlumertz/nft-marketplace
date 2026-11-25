import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { env } from '@/lib/env'
import {
  nftUpdatedSchema,
  type Nft,
  type NftList,
  type ServerToClientEvents,
  type ClientToServerEvents,
} from './contracts'
import { nftKeys } from './queries'

export function useCatalogEvents() {
  const queryClient = useQueryClient()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    let disposed = false
    let queue = Promise.resolve()
    const versions = new Map<string, number>()
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      env.socketUrl,
      {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
      },
    )

    const onConnect = () => {
      socket.emit('catalog.subscribe')
      // REST reconcilia o estado mesmo se algum evento foi perdido na desconexao.
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
    }

    const onNftUpdated = (payload: unknown) => {
      const parsed = nftUpdatedSchema.safeParse(payload)
      if (!parsed.success) return
      const { data: nft } = parsed.data
      queue = queue.then(async () => {
        if (disposed) return
        const cached =
          queryClient.getQueryData<Nft>(nftKeys.detail(nft.id))?.version ?? 0
        const listVersions = queryClient
          .getQueriesData<NftList>({ queryKey: nftKeys.lists })
          .flatMap(([, list]) =>
            [...(list?.items ?? []), ...(list?.featured ?? [])]
              .filter((item) => item.id === nft.id)
              .map((item) => item.version),
          )
        if (
          nft.version <=
          Math.max(versions.get(nft.id) ?? 0, cached, ...listVersions)
        )
          return
        versions.set(nft.id, nft.version)
        // Interrompe snapshots anteriores ao evento antes de atualizar o cache.
        await queryClient.cancelQueries({ queryKey: nftKeys.all })
        if (disposed) return
        const replace = (item: Nft) =>
          item.id === nft.id && item.version < nft.version ? nft : item
        queryClient.setQueriesData<NftList>(
          { queryKey: nftKeys.lists },
          (current) =>
            current
              ? {
                  ...current,
                  items: current.items.map(replace),
                  featured: current.featured.map(replace),
                }
              : current,
        )
        queryClient.setQueryData<Nft>(nftKeys.detail(nft.id), (current) =>
          current ? replace(current) : current,
        )
        setAnnouncement(`Preço ou disponibilidade de ${nft.name} atualizado.`)
        // Preço afeta ordenação, faixa e paginação; somente REST recompõe a lista.
        await queryClient.invalidateQueries({ queryKey: nftKeys.all })
      })
    }

    socket.on('connect', onConnect)
    socket.on('nft.updated', onNftUpdated)
    socket.connect()

    return () => {
      disposed = true
      socket.off('connect', onConnect)
      socket.off('nft.updated', onNftUpdated)
      socket.disconnect()
    }
  }, [queryClient])

  return announcement
}
