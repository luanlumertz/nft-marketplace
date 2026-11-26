import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { FavoritesPage } from '@/features/favorites/favorites-page'

export const Route = createFileRoute('/favoritos')({
  staticData: { requiresAuth: true },
  beforeLoad: ({ context, location }) =>
    requireSession(context.queryClient, location.href),
  component: FavoritesPage,
})
