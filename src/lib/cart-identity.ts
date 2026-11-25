const guestKey = 'kurio:cart-guest'

export function getCartGuestId() {
  let id = localStorage.getItem(guestKey)
  if (!id || !/^[\da-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID()
    localStorage.setItem(guestKey, id)
  }
  return id
}
