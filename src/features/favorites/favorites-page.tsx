import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useSession } from '@/features/auth/session'
import { favoritesOptions } from './favorites'
import { nftDetailOptions } from '@/features/nfts/queries'
import { FavoriteButton } from './favorite-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function FavoritesPage() {
  const session = useSession(),
    user = session.data?.user
  const favorites = useQuery({
    ...favoritesOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  const items = useQueries({
    queries: (user ? (favorites.data?.ids ?? []) : []).map((id) =>
      nftDetailOptions(id),
    ),
  })
  if (!user)
    return (
      <p role="status" className="py-16 text-muted-foreground">
        Entre para ver seus favoritos.
      </p>
    )
  return (
    <section className="py-4">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="text-primary" />
        <h1 className="text-3xl font-bold">Meus favoritos</h1>
      </div>
      {favorites.isPending ? (
        <Skeleton className="h-72" />
      ) : favorites.isError ? (
        <div role="alert">
          Não foi possível carregar seus favoritos.{' '}
          <Button
            variant="link"
            onClick={() => {
              void favorites.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !favorites.data.ids.length ? (
        <div className="space-y-4 py-16">
          <p className="text-muted-foreground">
            Sua coleção de favoritos começa com uma descoberta.
          </p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-6 tablet:grid-cols-3 mobile:grid-cols-2 mobile:gap-4">
          {items.map((item, index) => (
            <li key={favorites.data.ids[index]} className="relative">
              {item.isPending ? (
                <Skeleton className="aspect-square" />
              ) : item.isError ? (
                <div className="rounded-xl border border-border p-4 text-sm">
                  Não foi possível carregar este NFT.{' '}
                  <button
                    className="text-primary underline"
                    onClick={() => {
                      void item.refetch()
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/nfts/$nftId"
                    params={{ nftId: item.data.id }}
                    className="block"
                  >
                    <div className="rounded-[12px] bg-card p-3">
                      <img
                        src={item.data.imageUrl}
                        alt={`Arte de ${item.data.name}`}
                        className="aspect-square w-full rounded-2xl object-cover"
                      />
                    </div>
                    <h2 className="mt-3 text-sm">{item.data.name}</h2>
                    <p className="text-primary">{item.data.priceEth} ETH</p>
                  </Link>
                  <FavoriteButton
                    id={item.data.id}
                    name={item.data.name}
                    className="absolute top-4 right-4 size-8 rounded-full bg-card"
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
