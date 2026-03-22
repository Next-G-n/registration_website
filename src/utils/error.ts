import { ApiError } from '../api/client'

function toMessage(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => toMessage(item))
      .filter((item): item is string => Boolean(item && item.trim()))
    return parts.length ? parts.join('; ') : undefined
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>

    // FastAPI style validation issue: { type, loc, msg, input }
    if (typeof record.msg === 'string') {
      const loc = Array.isArray(record.loc)
        ? record.loc
            .map((part) => (typeof part === 'string' || typeof part === 'number' ? String(part) : ''))
            .filter(Boolean)
            .join('.')
        : undefined
      return loc ? `${loc}: ${record.msg}` : record.msg
    }

    if (record.error && typeof record.error === 'object') {
      const nestedErrorMessage = toMessage((record.error as Record<string, unknown>).message)
      if (nestedErrorMessage) return nestedErrorMessage
    }

    const directMessage = toMessage(record.message)
    if (directMessage) return directMessage

    const detailMessage = toMessage(record.detail)
    if (detailMessage) return detailMessage

    try {
      return JSON.stringify(record)
    } catch {
      return undefined
    }
  }

  return undefined
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  if (error instanceof ApiError) {
    const message = toMessage(error.payload) || toMessage(error.message)
    return message || fallback
  }

  const message = toMessage(error)
  if (message) return message

  const status = (error as { response?: { status?: number }; status?: number })?.response?.status ??
    (error as { status?: number })?.status
  if (status) return `Request failed (${status})`

  return fallback
}

export function getErrorStatus(error: unknown) {
  if (error instanceof ApiError) return error.status
  if (typeof error === 'object' && error) {
    const maybeStatus = (error as { status?: number }).status
    if (maybeStatus) return maybeStatus
    const responseStatus = (error as { response?: { status?: number } }).response?.status
    if (responseStatus) return responseStatus
  }
  return undefined
}
