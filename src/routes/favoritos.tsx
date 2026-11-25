import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionOptions } from '@/features/auth/session'
import { FavoritesPage } from '@/features/favorites/favorites-page'
export const Route = createFileRoute('/favoritos')({
  staticData: { requiresAuth: true },
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery({
      ...sessionOptions,
      staleTime: 0,
    })
    if (!session.user || !session.expiresAt || session.expiresAt <= Date.now())
      throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: FavoritesPage,
})
