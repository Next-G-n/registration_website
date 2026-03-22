const TOKEN_KEY = 'vr_token'

type Listener = (token: string | null) => void

const listeners = new Set<Listener>()

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
    listeners.forEach((listener) => listener(token))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    listeners.forEach((listener) => listener(null))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
