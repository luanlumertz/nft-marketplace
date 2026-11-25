const tokenKey = 'kurio:session-token'
export const sessionExpiredEvent = 'kurio:session-expired'
export function getSessionToken() {
  return localStorage.getItem(tokenKey)
}
export function saveSessionToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token)
  else localStorage.removeItem(tokenKey)
}
export function isSessionStorageEvent(event: StorageEvent) {
  return event.key === tokenKey || event.key === null
}
