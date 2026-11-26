import {
  queryOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { http } from '@/lib/http'
import { getSessionToken } from '@/lib/credentials'
import { sessionKey, useSession } from '@/features/auth/session'
import { userSchema, type Session } from '@/features/auth/contracts'
import {
  profileSchema,
  walletsSchema,
  type Profile,
  type ProfileUpdate,
  type Wallets,
  type WalletSave,
  type WalletSlot,
} from './contracts'

export const accountKeys = {
  profile: (id: string) => ['private', id, 'profile'] as const,
  wallets: (id: string) => ['private', id, 'wallets'] as const,
}
const headers = (token: string | null) => ({
  Authorization: token ? `Bearer ${token}` : '',
})
export function profileOptions(userId: string) {
  const token = getSessionToken()
  return queryOptions({
    queryKey: accountKeys.profile(userId),
    retry: false,
    queryFn: async ({ signal }) =>
      profileSchema.parse(
        (await http.get('/profile', { signal, headers: headers(token) })).data,
      ),
  })
}
export function walletsOptions(userId: string) {
  const token = getSessionToken()
  return queryOptions({
    queryKey: accountKeys.wallets(userId),
    retry: false,
    queryFn: async ({ signal }) =>
      walletsSchema.parse(
        (await http.get('/wallets', { signal, headers: headers(token) })).data,
      ),
  })
}
type Origin = { token: string | null; userId: string }
function isCurrent(origin: Origin) {
  return origin.token !== null && origin.token === getSessionToken()
}
export function useSaveProfile() {
  const client = useQueryClient(),
    session = useSession()
  const mutation = useMutation({
    mutationFn: async ({
      input,
      origin,
    }: {
      input: ProfileUpdate
      origin: Origin
    }) => {
      if (!isCurrent(origin))
        throw new Error('Entre novamente antes de salvar.')
      await client.cancelQueries({
        queryKey: accountKeys.profile(origin.userId),
      })
      return profileSchema.parse(
        (
          await http.patch('/profile', input, {
            headers: headers(origin.token),
          })
        ).data,
      )
    },
    onSuccess: async (profile, { origin }) => {
      if (!isCurrent(origin)) return
      await client.cancelQueries({ queryKey: sessionKey })
      await client.cancelQueries({
        queryKey: accountKeys.profile(origin.userId),
      })
      if (!isCurrent(origin)) return
      client.setQueryData(accountKeys.profile(origin.userId), profile)
      client.setQueryData<Session>(sessionKey, (current) =>
        current?.user?.id === origin.userId
          ? { ...current, user: userSchema.parse(profile) }
          : current,
      )
      void client.invalidateQueries({
        queryKey: accountKeys.profile(origin.userId),
      })
    },
  })
  return {
    mutation,
    save: (input: ProfileUpdate, onSuccess: (profile: Profile) => void) => {
      if (!session.data?.user || mutation.isPending) return
      const origin = { token: getSessionToken(), userId: session.data.user.id }
      mutation.mutate(
        { input, origin },
        {
          onSuccess: (profile) => {
            if (isCurrent(origin)) onSuccess(profile)
          },
        },
      )
    },
  }
}
export function useSaveWallet() {
  const client = useQueryClient(),
    session = useSession()
  const key = ['wallet-save', session.data?.user?.id]
  const pending = useIsMutating({ mutationKey: key }) > 0
  const mutation = useMutation({
    mutationKey: key,
    mutationFn: async ({
      slot,
      input,
      origin,
    }: {
      slot: WalletSlot
      input: WalletSave | null
      origin: Origin
    }) => {
      if (!isCurrent(origin))
        throw new Error('Entre novamente antes de salvar.')
      await client.cancelQueries({
        queryKey: accountKeys.wallets(origin.userId),
      })
      return walletsSchema.parse(
        (input === null
          ? await http.delete(`/wallets/${slot}`, {
              headers: headers(origin.token),
            })
          : await http.put(`/wallets/${slot}`, input, {
              headers: headers(origin.token),
            })
        ).data,
      )
    },
    onSuccess: async (wallets, { origin }) => {
      if (!isCurrent(origin)) return
      await client.cancelQueries({
        queryKey: accountKeys.wallets(origin.userId),
      })
      if (isCurrent(origin)) {
        client.setQueryData(accountKeys.wallets(origin.userId), wallets)
        void client.invalidateQueries({
          queryKey: accountKeys.wallets(origin.userId),
        })
        void client.invalidateQueries({
          queryKey: ['private', origin.userId, 'checkout'],
        })
      }
    },
  })
  return {
    mutation,
    pending,
    removeSecondary: (onSuccess: () => void) => {
      if (!session.data?.user || pending) return
      const origin = { token: getSessionToken(), userId: session.data.user.id }
      mutation.mutate(
        { slot: 'secondary', input: null, origin },
        {
          onSuccess: () => {
            if (isCurrent(origin)) onSuccess()
          },
        },
      )
    },
    save: (
      slot: WalletSlot,
      input: WalletSave,
      onSuccess: (wallets: Wallets) => void,
    ) => {
      if (!session.data?.user || pending) return
      const origin = { token: getSessionToken(), userId: session.data.user.id }
      mutation.mutate(
        { slot, input, origin },
        {
          onSuccess: (wallets) => {
            if (isCurrent(origin)) onSuccess(wallets)
          },
        },
      )
    },
  }
}
