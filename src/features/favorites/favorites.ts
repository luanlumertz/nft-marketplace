import { z } from 'zod'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { http } from '@/lib/http'
import { getSessionToken } from '@/lib/credentials'
import { favoriteKey, useSession } from '@/features/auth/session'

export const favoritesSchema = z.object({ ids: z.array(z.string()) })
export type Favorites = z.infer<typeof favoritesSchema>
export function favoritesOptions(userId: string) {
  const token = getSessionToken()
  return queryOptions({
    queryKey: favoriteKey(userId),
    retry: false,
    queryFn: async ({ signal }) => {
      if (token !== getSessionToken()) throw new Error('Sessão alterada.')
      return favoritesSchema.parse(
        (
          await http.get('/favorites', {
            signal,
            headers: { Authorization: `Bearer ${token}` },
          })
        ).data,
      )
    },
  })
}
export function useFavorite(id: string) {
  const session = useSession(),
    user = session.data?.user
  const client = useQueryClient()
  const query = useQuery({
    ...favoritesOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  const mutation = useMutation({
    mutationKey: ['favorite', user?.id, id],
    mutationFn: async (input: { active: boolean; token: string | null }) => {
      if (!user || !input.token || input.token !== getSessionToken())
        throw new Error('Entre novamente para favoritar.')
      const response = await http.request({
        method: input.active ? 'PUT' : 'DELETE',
        url: `/favorites/${encodeURIComponent(id)}`,
        headers: { Authorization: `Bearer ${input.token}` },
      })
      return favoritesSchema.parse(response.data)
    },
    onMutate: async (input) => {
      const key = favoriteKey(user?.id ?? 'anonymous')
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Favorites>(key)
      if (input.token === getSessionToken() && user) {
        const ids = new Set(previous?.ids ?? [])
        if (input.active) ids.add(id)
        else ids.delete(id)
        client.setQueryData(key, { ids: [...ids] })
      }
      return { previous, key, token: input.token }
    },
    onError: (_error, _input, context) => {
      if (context && context.token === getSessionToken())
        client.setQueryData(context.key, context.previous ?? { ids: [] })
    },
    onSuccess: (data, input, context) => {
      if (input.token === getSessionToken())
        client.setQueryData(context.key, data)
    },
    onSettled: (_data, _error, input, context) => {
      if (context && input.token === getSessionToken())
        void client.invalidateQueries({ queryKey: context.key })
    },
  })
  return {
    user,
    active: query.data?.ids.includes(id) ?? false,
    isLoading: session.isPending || (!!user && query.isPending),
    queryError: query.error,
    mutation,
    toggle: () => {
      if (!mutation.isPending)
        mutation.mutate({
          active: !(query.data?.ids.includes(id) ?? false),
          token: getSessionToken(),
        })
    },
  }
}
