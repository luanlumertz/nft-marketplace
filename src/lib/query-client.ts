import { QueryClient } from '@tanstack/react-query'
import { isAxiosError, isCancel } from 'axios'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (failureCount >= 1 || isCancel(error) || !isAxiosError(error))
            return false
          return !error.response || error.response.status >= 500
        },
      },
      mutations: { retry: false },
    },
  })
}

export const queryClient = createQueryClient()
