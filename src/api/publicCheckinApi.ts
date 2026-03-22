import { tokenStore } from '../auth/tokenStore'
import type {
  CheckoutFeedbackPayload,
  CheckoutFeedbackResponse,
  PublicApiError,
  PublicCheckInPayload,
  PublicCheckInSuccess,
  PublicOrgMetadata,
  PublicPrefillPerson,
  PublicPrefillRequest,
  PublicPrefillResponse,
  VisitorHistoryRow,
} from '../types/checkin'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://registration-api-pdvk.onrender.com'

const defaultPurposes = ['Meeting', 'Interview', 'Delivery', 'Service', 'Other']

function withBase(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`
}

function withAuthHeaders(headers: HeadersInit = {}): Headers {
  const resolved = new Headers(headers)
  const token = tokenStore.get()
  if (token) {
    resolved.set('Authorization', `Bearer ${token}`)
  }
  return resolved
}

function toFieldErrors(data: unknown): Record<string, string> {
  const output: Record<string, string> = {}

  if (!data || typeof data !== 'object') return output
  const record = data as Record<string, unknown>

  if (Array.isArray(record.detail)) {
    for (const item of record.detail) {
      if (!item || typeof item !== 'object') continue
      const error = item as Record<string, unknown>
      const loc = Array.isArray(error.loc) ? error.loc.map((part) => String(part)) : []
      const field = loc[loc.length - 1]
      const message = typeof error.msg === 'string' ? error.msg : 'Invalid value'
      if (field) output[field] = message
    }
  } else {
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string') output[key] = value
      if (Array.isArray(value) && typeof value[0] === 'string') output[key] = value[0]
    }
  }

  return output
}

async function throwApiError(response: Response): Promise<never> {
  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = undefined
  }

  const err = new Error(`Request failed (${response.status})`) as PublicApiError
  err.status = response.status
  err.data = data
  err.fieldErrors = toFieldErrors(data)
  throw err
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readNumber(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value)
  if (Number.isFinite(numberValue)) return numberValue
  return null
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return null
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed) return trimmed
  }
  return null
}

function normalizeMetadata(data: unknown): PublicOrgMetadata {
  const record = (data || {}) as Record<string, unknown>
  const registrationPointRaw =
    record.registration_point && typeof record.registration_point === 'object'
      ? (record.registration_point as Record<string, unknown>)
      : null
  const departmentRaw =
    registrationPointRaw?.department && typeof registrationPointRaw.department === 'object'
      ? (registrationPointRaw.department as Record<string, unknown>)
      : null
  const organizationRaw =
    registrationPointRaw?.organization && typeof registrationPointRaw.organization === 'object'
      ? (registrationPointRaw.organization as Record<string, unknown>)
      : null
  const rawDepartments = Array.isArray(record.departments) ? record.departments : []

  const departmentsFromArray = rawDepartments
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name || ''),
    }))
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name.length > 0)

  const fallbackDepartment =
    departmentRaw && Number.isInteger(Number(departmentRaw.id)) && Number(departmentRaw.id) > 0 && String(departmentRaw.name || '')
      ? [{ id: Number(departmentRaw.id), name: String(departmentRaw.name) }]
      : []

  const departments = departmentsFromArray.length ? departmentsFromArray : fallbackDepartment

  const purposesRaw = Array.isArray(record.purposes) ? record.purposes : []
  const purposes = purposesRaw.map((item) => String(item || '').trim()).filter(Boolean)

  return {
    active: typeof record.active === 'boolean' ? record.active : undefined,
    org_name: String(record.org_name || organizationRaw?.name || 'Organization'),
    company_image: pickFirstString(record.company_image, organizationRaw?.company_image, record.logo_url, organizationRaw?.logo_url),
    logo_url: pickFirstString(record.logo_url, organizationRaw?.logo_url, record.company_image, organizationRaw?.company_image),
    primary_color: pickFirstString(record.primary_color, organizationRaw?.primary_color),
    accent_color: pickFirstString(record.accent_color, organizationRaw?.accent_color),
    background_color: pickFirstString(record.background_color, organizationRaw?.background_color),
    text_color: pickFirstString(record.text_color, organizationRaw?.text_color),
    registration_point: registrationPointRaw
      ? {
          id: Number(registrationPointRaw.id) || 0,
          name: String(registrationPointRaw.name || ''),
          department: departmentRaw
            ? {
                id: Number(departmentRaw.id) || 0,
                name: String(departmentRaw.name || ''),
              }
            : null,
          organization: organizationRaw
            ? {
                id: Number(organizationRaw.id) || 0,
                name: String(organizationRaw.name || ''),
              }
            : null,
        }
      : null,
    departments,
    purposes: purposes.length ? purposes : defaultPurposes,
  }
}

function normalizeVisitor(record: Record<string, unknown>): VisitorHistoryRow {
  const firstName = readString(record.first_name) || readString(record.first_names) || ''
  const lastName = readString(record.last_name) || readString(record.surname) || ''
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const checkOutAt = readString(record.check_out_at) || readString(record.checkout_at)

  const rawStatus = readString(record.status)?.toUpperCase() || ''
  const normalizedStatus: 'IN' | 'OUT' = rawStatus === 'CLOSED' || rawStatus === 'OUT' || Boolean(checkOutAt) ? 'OUT' : 'IN'

  const departmentName =
    readString(record.department_name) ||
    readString((record.department as Record<string, unknown> | undefined)?.name) ||
    readString(record.department)

  const publicKey =
    readString(record.public_key) ||
    readString(record.registration_point_public_key) ||
    readString((record.registration_point as Record<string, unknown> | undefined)?.public_key)
  const checkinSource = readString(record.checkin_source) || readString(record.source) || readString(record.channel)
  const feedbackRecord = record.feedback && typeof record.feedback === 'object' ? (record.feedback as Record<string, unknown>) : null

  return {
    id: readNumber(record.id) || 0,
    checkin_id: readNumber(record.checkin_id) || readNumber(record.id) || 0,
    full_name: readString(record.full_name) || fallbackName || 'Visitor',
    citizen_status: (readString(record.citizen_status) || readString(record.visitor_type)) as VisitorHistoryRow['citizen_status'],
    visit_context: readString(record.visit_context) as VisitorHistoryRow['visit_context'],
    company_name: readString(record.company_name),
    company_location: readString(record.company_location),
    apartment_number: readString(record.apartment_number) || readString(record.plot_number),
    plot_number: readString(record.plot_number) || readString(record.apartment_number),
    address_street: readString(record.address_street),
    address_city: readString(record.address_city),
    address_country: readString(record.address_country),
    department: departmentName,
    purpose: readString(record.purpose),
    reason_for_visit_text: readString(record.reason_for_visit_text) || readString(record.reason) || readString(record.notes),
    check_in_at: readString(record.check_in_at),
    check_out_at: checkOutAt,
    status: normalizedStatus,
    checkin_source: checkinSource,
    public_key: publicKey,
    person_id: readNumber(record.person_id),
    id_masked: readString(record.id_masked) || readString(record.id_last4),
    visitor_photo: readString(record.visitor_photo),
    mobile_phone: readString(record.mobile_phone) || readString(record.phone),
    email: readString(record.email),
    feedback_opt_in:
      readBoolean(record.feedback_opt_in) ??
      readBoolean(record.opt_in) ??
      readBoolean(feedbackRecord?.feedback_opt_in) ??
      readBoolean(feedbackRecord?.opt_in),
    feedback_rating:
      readNumber(record.feedback_rating) ??
      readNumber(record.rating_1_to_5) ??
      readNumber(record.rating) ??
      readNumber(feedbackRecord?.feedback_rating) ??
      readNumber(feedbackRecord?.rating_1_to_5) ??
      readNumber(feedbackRecord?.rating),
    feedback_was_helpful:
      readBoolean(record.feedback_was_helpful) ??
      readBoolean(record.was_helpful) ??
      readBoolean(feedbackRecord?.feedback_was_helpful) ??
      readBoolean(feedbackRecord?.was_helpful),
    feedback_visit_outcome:
      (readString(record.feedback_visit_outcome) as VisitorHistoryRow['feedback_visit_outcome']) ||
      (readString(record.visit_outcome) as VisitorHistoryRow['feedback_visit_outcome']) ||
      (readString(record.outcome) as VisitorHistoryRow['feedback_visit_outcome']) ||
      (readString(feedbackRecord?.feedback_visit_outcome) as VisitorHistoryRow['feedback_visit_outcome']) ||
      (readString(feedbackRecord?.visit_outcome) as VisitorHistoryRow['feedback_visit_outcome']) ||
      (readString(feedbackRecord?.outcome) as VisitorHistoryRow['feedback_visit_outcome']) ||
      null,
    feedback_comment:
      readString(record.feedback_comment) ||
      readString(record.comment) ||
      readString(record.feedback_notes) ||
      readString(feedbackRecord?.feedback_comment) ||
      readString(feedbackRecord?.comment) ||
      readString(feedbackRecord?.feedback_notes),
    raw: record,
  }
}

function normalizePrefillPerson(data: unknown): PublicPrefillPerson | null {
  if (!data || typeof data !== 'object') return null
  const person = data as Record<string, unknown>

  return {
    first_name: readString(person.first_name),
    last_name: readString(person.last_name),
    date_of_birth: readString(person.date_of_birth),
    gender: (readString(person.gender) as PublicPrefillPerson['gender']) || null,
    nationality: readString(person.nationality),
    apartment_number: readString(person.apartment_number),
    address_street: readString(person.address_street),
    address_city: readString(person.address_city),
    address_country: readString(person.address_country),
    mobile_phone: readString(person.mobile_phone) || readString(person.phone),
    email: readString(person.email),
    citizen_status: (readString(person.citizen_status) as PublicPrefillPerson['citizen_status']) || null,
    omang_number: readString(person.omang_number),
    passport_number: readString(person.passport_number),
    passport_country: readString(person.passport_country),
  }
}

export async function getPublicOrgMetadata(publicKey: string): Promise<PublicOrgMetadata> {
  const url = withBase(`/public/p/${encodeURIComponent(publicKey)}`)
  console.info('[public-checkin] GET metadata', { url, publicKey })

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()
  const normalized = normalizeMetadata(data)

  console.info('[public-checkin] metadata response', {
    status: response.status,
    raw: data,
    normalizedDepartments: normalized.departments,
    departmentsCount: normalized.departments.length,
  })

  return normalized
}

export async function submitPublicCheckIn(
  publicKey: string,
  payload: PublicCheckInPayload,
  idempotencyKey: string,
): Promise<PublicCheckInSuccess> {
  const requestBody = JSON.stringify(payload)

  const request = async (path: string) =>
    fetch(withBase(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: requestBody,
    })

  let response = await request(`/public/p/${encodeURIComponent(publicKey)}/checkins`)

  if (response.status === 404) {
    response = await request(`/public/p/${encodeURIComponent(publicKey)}/checkin`)
  }

  if (!response.ok) {
    await throwApiError(response)
  }

  return (await response.json()) as PublicCheckInSuccess
}

export async function prefillPublicCheckIn(
  publicKey: string,
  payload: PublicPrefillRequest,
): Promise<PublicPrefillResponse> {
  const response = await fetch(withBase(`/public/p/${encodeURIComponent(publicKey)}/prefill`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = (await response.json()) as Record<string, unknown>
  const found = typeof data.found === 'boolean' ? data.found : false
  const person = normalizePrefillPerson(data.person)

  return {
    found,
    person: found ? person : null,
  }
}

export async function listOrgVisitors(filters: {
  from?: string
  to?: string
  department_id?: number
  q?: string
}): Promise<VisitorHistoryRow[]> {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.department_id) params.set('department_id', String(filters.department_id))
  if (filters.q) params.set('q', filters.q)

  const query = params.toString()
  const url = withBase(`/org/visits${query ? `?${query}` : ''}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: withAuthHeaders({ Accept: 'application/json' }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()
  const rows = Array.isArray(data) ? data : []
  return rows
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => normalizeVisitor(item))
}

export async function checkoutPublicCheckIn(
  publicKey: string,
  checkinId: number,
  payload: CheckoutFeedbackPayload,
): Promise<CheckoutFeedbackResponse> {
  const response = await fetch(withBase(`/public/p/${encodeURIComponent(publicKey)}/checkins/${checkinId}/checkout`), {
    method: 'POST',
    headers: withAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return (await response.json()) as CheckoutFeedbackResponse
}
