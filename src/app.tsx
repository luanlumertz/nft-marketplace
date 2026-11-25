import { QueryClientProvider } from '@tanstack/react-query'
import {
  createRouter,
  RouterProvider,
  defaultParseSearch,
} from '@tanstack/react-router'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from './routeTree.gen'

const queryClient = createQueryClient()
const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  parseSearch: (value) => {
    const parsed: Record<string, unknown> = { ...defaultParseSearch(value) }
    const raw = new URLSearchParams(value)
    for (const key of ['minPrice', 'maxPrice']) {
      const amount = raw.get(key)
      if (amount !== null && !amount.startsWith('"')) parsed[key] = amount
    }
    return parsed
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
