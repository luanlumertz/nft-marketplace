import { z } from 'zod'
import { userFixtures } from './fixtures/users'
import { userSchema, type User } from '@/features/auth/contracts'
import {
  profileSchema,
  walletSchema,
  type Profile,
  type ProfileUpdate,
  type Wallet,
  type WalletSave,
  type WalletSlot,
} from '@/features/account/contracts'

const key = 'kurio:accounts:v1'
const accountSchema = userSchema.extend({
  salt: z.string(),
  passwordHash: z.string(),
})
const stateSchema = z.object({
  users: z.array(accountSchema),
  sessions: z.array(
    z.object({ token: z.string(), userId: z.string(), expiresAt: z.number() }),
  ),
  favorites: z.record(z.string(), z.array(z.string())),
  profiles: z.record(z.string(), profileSchema).default({}),
  wallets: z.record(z.string(), z.array(walletSchema).max(2)).default({}),
})
type AccountState = z.infer<typeof stateSchema>
const initial = (): AccountState => ({
  users: structuredClone(userFixtures),
  sessions: [],
  favorites: { ana: ['sage-nomad-009'], bruno: ['golden-beat-207'] },
  profiles: {},
  wallets: {},
})
function restore() {
  try {
    const raw = localStorage.getItem(key)
    return raw ? stateSchema.parse(JSON.parse(raw)) : initial()
  } catch {
    return initial()
  }
}
let state = restore()
window.addEventListener('storage', (event) => {
  if (event.key === key || event.key === null) state = restore()
})
function persist() {
  localStorage.setItem(key, JSON.stringify(state))
}
function commit(next: AccountState) {
  localStorage.setItem(key, JSON.stringify(next))
  state = next
}
function profileFor(userId: string): Profile {
  const existing = state.profiles[userId]
  if (existing) return existing
  const user = state.users.find((user) => user.id === userId)!
  const base = user.email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, 20)
    .padEnd(3, '0')
  let username = base
  if (
    Object.values(state.profiles).some(
      (profile) => profile.username === username,
    )
  )
    username = `${base}.${userId.slice(0, 6)}`
  const ens = username
    .replace(/[._]/g, '-')
    .replace(/^-+|-+$/g, '')
    .padEnd(3, '0')
  const profile = profileSchema.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    username,
    ensName: `${ens}.eth`,
    walletAlias: `Carteira de ${user.name.split(' ')[0]}`.slice(0, 40),
    avatarUrl: null,
  })
  const next = structuredClone(state)
  next.profiles[userId] = profile
  commit(next)
  return profile
}
type UpdateError = {
  status: number
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
}
const hex = (bytes: Uint8Array) =>
  [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
async function hash(password: string, salt: string) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const saltBytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], (value) =>
    Number.parseInt(value, 16),
  )
  return hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          hash: 'SHA-256',
          iterations: 100000,
          salt: saltBytes,
        },
        material,
        256,
      ),
    ),
  )
}
export function requestToken(request: Request) {
  return request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
}
export const accounts = {
  reset() {
    state = initial()
    persist()
    localStorage.removeItem('kurio:session-token')
  },
  async login(email: string, password: string) {
    const user = state.users.find((user) => user.email === email)
    if (!user || (await hash(password, user.salt)) !== user.passwordHash)
      return null
    return userSchema.parse(user)
  },
  async register(input: { name: string; email: string; password: string }) {
    if (state.users.some((user) => user.email === input.email)) return null
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
    const passwordHash = await hash(input.password, salt)
    // Revalida após a derivação assíncrona para impedir dois cadastros concorrentes.
    if (state.users.some((user) => user.email === input.email)) return null
    const user = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      salt,
      passwordHash,
    }
    state.users.push(user)
    state.favorites[user.id] = []
    persist()
    return userSchema.parse(user)
  },
  authenticate(user: User) {
    const token = crypto.randomUUID(),
      expiresAt = Date.now() + 24 * 60 * 60_000
    state.sessions = state.sessions.filter(
      (session) => session.expiresAt > Date.now(),
    )
    state.sessions.push({ token, userId: user.id, expiresAt })
    persist()
    return { user, token, expiresAt }
  },
  session(token: string) {
    const session = state.sessions.find(
      (session) => session.token === token && session.expiresAt > Date.now(),
    )
    const user =
      session && state.users.find((user) => user.id === session.userId)
    return session && user
      ? { user: userSchema.parse(user), expiresAt: session.expiresAt }
      : null
  },
  revoke(token: string) {
    state.sessions = state.sessions.filter((session) => session.token !== token)
    persist()
  },
  expireAll() {
    state.sessions = []
    persist()
  },
  favorites(userId: string) {
    return [...(state.favorites[userId] ?? [])]
  },
  favorite(userId: string, id: string, active: boolean) {
    const ids = new Set(state.favorites[userId] ?? [])
    if (active) ids.add(id)
    else ids.delete(id)
    state.favorites[userId] = [...ids]
    persist()
    return [...ids]
  },
  profile: profileFor,
  async updateProfile(
    token: string,
    input: ProfileUpdate,
  ): Promise<Profile | UpdateError> {
    const current = accounts.session(token)
    if (!current)
      return {
        status: 401,
        code: 'SESSION_EXPIRED',
        message: 'Sua sessão expirou.',
      }
    const user = state.users.find((user) => user.id === current.user.id)!
    const previousHash = user.passwordHash
    let credentials: { salt: string; passwordHash: string } | undefined
    if (input.passwordChange) {
      if (
        (await hash(input.passwordChange.currentPassword, user.salt)) !==
        previousHash
      )
        return {
          status: 422,
          code: 'CURRENT_PASSWORD_INVALID',
          message: 'Confira a senha atual.',
          fieldErrors: { currentPassword: ['A senha atual está incorreta.'] },
        }
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
      credentials = {
        salt,
        passwordHash: await hash(input.passwordChange.newPassword, salt),
      }
    }
    // A derivação é assíncrona: sessão, credenciais e unicidade são rechecadas antes do commit.
    if (!accounts.session(token))
      return {
        status: 401,
        code: 'SESSION_EXPIRED',
        message: 'Sua sessão expirou.',
      }
    if (
      state.users.find((saved) => saved.id === user.id)?.passwordHash !==
      previousHash
    )
      return {
        status: 409,
        code: 'CREDENTIALS_CHANGED',
        message: 'As credenciais mudaram. Entre novamente antes de salvar.',
      }
    if (
      state.users.some(
        (saved) => saved.id !== user.id && saved.email === input.email,
      )
    )
      return {
        status: 409,
        code: 'EMAIL_CONFLICT',
        message: 'Este e-mail já está cadastrado.',
        fieldErrors: { email: ['Este e-mail já está cadastrado.'] },
      }
    // Materializa nomes de usuário das contas antigas antes da verificação de conflito.
    for (const saved of state.users) profileFor(saved.id)
    if (
      Object.values(state.profiles).some(
        (saved) => saved.id !== user.id && saved.username === input.username,
      )
    )
      return {
        status: 409,
        code: 'USERNAME_CONFLICT',
        message: 'Este nome de usuário já está em uso.',
        fieldErrors: { username: ['Escolha outro nome de usuário.'] },
      }
    const next = structuredClone(state)
    const target = next.users.find((saved) => saved.id === user.id)!
    target.name = input.name
    target.email = input.email
    if (credentials) {
      Object.assign(target, credentials)
      next.sessions = next.sessions.filter(
        (session) => session.userId !== user.id || session.token === token,
      )
    }
    const profile = profileSchema.parse({ ...input, id: user.id })
    next.profiles[user.id] = profile
    commit(next)
    return profile
  },
  wallets(userId: string) {
    return { items: structuredClone(state.wallets[userId] ?? []) }
  },
  deleteSecondaryWallet(userId: string) {
    const next = structuredClone(state)
    next.wallets[userId] = (next.wallets[userId] ?? []).filter(
      (wallet) => wallet.slot !== 'secondary',
    )
    commit(next)
    return { items: structuredClone(next.wallets[userId]) }
  },
  saveWallet(
    userId: string,
    slot: WalletSlot,
    input: WalletSave,
  ): { items: Wallet[] } | UpdateError {
    const next = structuredClone(state)
    const items = next.wallets[userId] ?? []
    const previous = items.find((wallet) => wallet.slot === slot)
    let wallet: Wallet
    if (input.sameAsPrimary) {
      const primary = items.find((wallet) => wallet.slot === 'primary')
      if (slot !== 'secondary' || !primary)
        return {
          status: 422,
          code: 'PRIMARY_REQUIRED',
          message: 'Salve a carteira principal antes de usar esta opção.',
        }
      wallet = {
        ...primary,
        id: previous?.id ?? crypto.randomUUID(),
        slot: 'secondary',
        sameAsPrimary: true,
      }
    } else {
      wallet = walletSchema.parse({
        ...input,
        id: previous?.id ?? crypto.randomUUID(),
        slot,
        sameAsPrimary: false,
      })
    }
    const updated = items.filter((saved) => saved.slot !== slot).concat(wallet)
    if (slot === 'primary') {
      const secondary = updated.find(
        (saved) => saved.slot === 'secondary' && saved.sameAsPrimary,
      )
      if (secondary)
        Object.assign(secondary, wallet, {
          id: secondary.id,
          slot: 'secondary',
          sameAsPrimary: true,
        })
    }
    next.wallets[userId] = updated
    commit(next)
    return { items: structuredClone(updated) }
  },
}
