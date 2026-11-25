import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { WalletsPage } from '@/features/account/wallets-page'

export const Route = createFileRoute('/carteiras')({
  staticData: { requiresAuth: true },
  beforeLoad: ({ context, location }) =>
    requireSession(context.queryClient, location.href),
  component: WalletsPage,
})
