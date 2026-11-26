import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { CheckoutPage } from '@/features/checkout/checkout-page'

export const Route = createFileRoute('/pagamento')({
  staticData: { requiresAuth: true },
  beforeLoad: ({ context, location }) =>
    requireSession(context.queryClient, location.href),
  component: CheckoutPage,
})
