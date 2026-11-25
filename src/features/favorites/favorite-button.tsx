import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart, LoaderCircle } from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { useFavorite } from './favorites'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  id,
  name,
  className,
  label = false,
}: {
  id: string
  name: string
  className?: string
  label?: boolean
}) {
  const favorite = useFavorite(id),
    navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const message = favorite.mutation.error
    ? isAxiosError(favorite.mutation.error)
      ? favorite.mutation.error.response?.data?.message
      : 'Não foi possível atualizar o favorito.'
    : favorite.queryError
      ? 'Não foi possível carregar seus favoritos. Tente novamente.'
      : ''
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={label ? 'default' : 'icon'}
        className={cn(
          'border-primary bg-transparent text-primary hover:bg-primary/10',
          className,
        )}
        aria-label={`${favorite.active ? 'Remover dos favoritos' : 'Favoritar'} ${name}`}
        aria-pressed={favorite.active}
        disabled={favorite.isLoading || favorite.mutation.isPending}
        onClick={() => {
          if (!favorite.user) {
            void navigate({
              to: '/login',
              search: { redirect: href, favorite: id },
            })
            return
          }
          favorite.toggle()
        }}
      >
        {favorite.mutation.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Heart
            className="size-4.5"
            fill={favorite.active ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        )}
        {label && (favorite.active ? 'Favoritado' : 'Favoritar')}
      </Button>
      {message && (
        <span role="alert" className="block max-w-80 text-xs text-destructive">
          {message}
        </span>
      )}
    </>
  )
}
