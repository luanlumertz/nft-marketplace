import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { ProfilePage } from '@/features/account/profile-page'

export const Route = createFileRoute('/perfil')({
  staticData: { requiresAuth: true },
  beforeLoad: ({ context, location }) =>
    requireSession(context.queryClient, location.href),
  component: ProfilePage,
})
