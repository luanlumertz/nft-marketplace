import { z } from 'zod'
import { userFixtures } from './fixtures/users'
import { userSchema, type User } from '@/features/auth/contracts'

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
})
type AccountState = z.infer<typeof stateSchema>
const initial = (): AccountState => ({
  users: structuredClone(userFixtures),
  sessions: [],
  favorites: { ana: ['sage-nomad-009'], bruno: ['golden-beat-207'] },
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
      expiresAt = Date.now() + 15 * 60_000
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
}
