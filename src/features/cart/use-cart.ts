import {
  queryOptions,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useSession } from '@/features/auth/session'
import { getSessionToken } from '@/lib/credentials'
import { getCartGuestId } from '@/lib/cart-identity'
import { http } from '@/lib/http'
import { cartSchema, type CartCommand } from './contracts'

export function isCartKey(key: readonly unknown[]) {
  return key[0] === 'cart-guest' || (key[0] === 'private' && key[2] === 'cart')
}
type CartScope = {
  key: readonly string[]
  token: string | null
  guestId: string
}
function headers(scope: CartScope) {
  return {
    Authorization: scope.token ? `Bearer ${scope.token}` : '',
    'X-Cart-Guest': scope.guestId,
  }
}
export function cartOptions(scope: CartScope) {
  return queryOptions({
    queryKey: scope.key,
    retry: false,
    queryFn: async ({ signal }) =>
      cartSchema.parse(
        (await http.get('/cart', { signal, headers: headers(scope) })).data,
      ),
  })
}
function current(scope: CartScope) {
  return scope.token === getSessionToken() && scope.guestId === getCartGuestId()
}
export function useCart() {
  const session = useSession()
  const user = session.data?.user
  const guestId = getCartGuestId()
  const scope: CartScope = {
    key: user ? ['private', user.id, 'cart'] : ['cart-guest', guestId],
    token: getSessionToken(),
    guestId,
  }
  const client = useQueryClient()
  const query = useQuery({
    ...cartOptions(scope),
    enabled: !session.isPending && !session.isError,
  })
  const pending = useIsMutating({ mutationKey: scope.key }) > 0
  const mutation = useMutation({
    mutationKey: scope.key,
    mutationFn: async ({
      command,
      origin,
    }: {
      command: CartCommand
      origin: CartScope
    }) => {
      if (!current(origin)) throw new Error('A sessão mudou. Tente novamente.')
      await client.cancelQueries({ queryKey: origin.key })
      const config = { headers: headers(origin) }
      let response
      if (command.type === 'add')
        response = await http.post('/cart/items', command.selection, config)
      else if (command.type === 'coupon')
        response = await http.post(
          '/cart/quote',
          { code: command.code },
          config,
        )
      else {
        const selection =
          command.type === 'quantity' ? command.selection : command
        const path = `/cart/items/${encodeURIComponent(selection.nftId)}/${encodeURIComponent(selection.editionId)}`
        response =
          command.type === 'remove'
            ? await http.delete(path, config)
            : await http.patch(
                path,
                { quantity: command.selection.quantity },
                config,
              )
      }
      return cartSchema.parse(response.data)
    },
    onSuccess: async (data, { origin }) => {
      if (!current(origin)) return
      await client.cancelQueries({ queryKey: origin.key })
      if (current(origin)) client.setQueryData(origin.key, data)
    },
    onSettled: (_data, _error, { origin }) => {
      if (current(origin))
        void client.invalidateQueries({ queryKey: origin.key })
    },
  })
  const error = mutation.error
  const message = error
    ? isAxiosError(error)
      ? (error.response?.data?.message ??
        'Não foi possível atualizar o carrinho. Tente novamente.')
      : error.message
    : ''
  return {
    query,
    session,
    user,
    pending,
    message: String(message),
    mutation,
    ready: !session.isPending && !session.isError && !!query.data,
    run: (command: CartCommand, onSuccess?: () => void) => {
      if (pending || session.isPending || session.isError) return
      mutation.mutate(
        { command, origin: scope },
        {
          onSuccess: () => {
            if (current(scope)) onSuccess?.()
          },
        },
      )
    },
  }
}
