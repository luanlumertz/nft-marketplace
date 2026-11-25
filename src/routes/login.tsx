import { createFileRoute } from '@tanstack/react-router'
import { validateAuthSearch } from '@/features/auth/contracts'
import { AuthPage } from '@/features/auth/auth-page'
export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  component: LoginPage,
})
function LoginPage() {
  const { redirect, favorite, reason } = Route.useSearch()
  return (
    <AuthPage
      mode="login"
      redirect={redirect}
      favorite={favorite}
      reason={reason}
    />
  )
}
