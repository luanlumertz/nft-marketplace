import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { sessionOptions } from './session'

export async function requireSession(queryClient: QueryClient, href: string) {
  const session = await queryClient.fetchQuery({
    ...sessionOptions,
    staleTime: 0,
  })
  if (!session.user || !session.expiresAt || session.expiresAt <= Date.now())
    throw redirect({ to: '/login', search: { redirect: href } })
}
