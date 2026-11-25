import { useMutation } from '@tanstack/react-query'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { catalogDefaults } from '@/features/nfts/catalog-search'
import { logout } from './session'

export function useLogout(onClose?: () => void) {
  const router = useRouter()
  const protectedRoute = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.staticData.requiresAuth === true),
  })
  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      onClose?.()
      if (protectedRoute)
        await router.navigate({
          to: '/',
          search: catalogDefaults,
          replace: true,
        })
    },
  })
}
