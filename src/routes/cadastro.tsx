import { createFileRoute } from '@tanstack/react-router'
import { validateAuthSearch } from '@/features/auth/contracts'
import { AuthPage } from '@/features/auth/auth-page'
export const Route = createFileRoute('/cadastro')({
  validateSearch: validateAuthSearch,
  component: RegisterPage,
})
function RegisterPage() {
  const { redirect, favorite, reason } = Route.useSearch()
  return (
    <AuthPage
      mode="register"
      redirect={redirect}
      favorite={favorite}
      reason={reason}
    />
  )
}
