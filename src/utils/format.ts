export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date)
}

export function formatNumber(value?: number | string | null) {
  if (value === null || value === undefined) return '—'
  const numberValue = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numberValue)) return String(value)
  return new Intl.NumberFormat('en-US').format(numberValue)
}
