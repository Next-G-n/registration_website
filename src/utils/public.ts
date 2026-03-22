export function buildPublicUrl(publicKey?: string | null) {
  if (!publicKey) return ''
  if (typeof window === 'undefined') return `/p/${publicKey}`
  return `${window.location.origin}/p/${publicKey}`
}

export function extractPublicKey(value?: string | null) {
  if (!value) return ''
  const match = value.match(/\/(?:public\/)?p\/([^/?#]+)/i)
  return match?.[1] || ''
}

export function resolvePublicKioskUrl(publicKey?: string | null, qrUrl?: string | null) {
  const key = publicKey || extractPublicKey(qrUrl)
  if (key) return buildPublicUrl(key)
  return qrUrl || ''
}
