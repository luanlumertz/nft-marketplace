import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { OrderPage } from '@/features/checkout/order-page'

export const Route = createFileRoute('/pedidos/$orderId')({
  staticData: { requiresAuth: true },
  beforeLoad: ({ context, location }) =>
    requireSession(context.queryClient, location.href),
  component: Screen,
})
function Screen() {
  const { orderId } = Route.useParams()
  return <OrderPage key={orderId} id={orderId} />
}
