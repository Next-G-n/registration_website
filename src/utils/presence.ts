export function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !Number.isNaN(value)
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some((entry) => isPresent(entry))
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.values(record).some((entry) => isPresent(entry))
  }
  return true
}

export function asCleanString(value: unknown): string | null {
  if (!isPresent(value)) return null
  return String(value).trim()
}

export function joinPresent(values: unknown[], separator = ', '): string | null {
  const cleaned = values
    .map((value) => asCleanString(value))
    .filter((value): value is string => Boolean(value))

  if (!cleaned.length) return null
  return cleaned.join(separator)
}
