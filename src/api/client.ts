import createClient from 'openapi-fetch'
import { tokenStore } from '../auth/tokenStore'
import type { paths } from './generated/schema'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://registration-api-pdvk.onrender.com'

function withBase(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`
}

function handle401(hadToken: boolean) {
  tokenStore.clear()
  if (typeof window === 'undefined') return
  const pathname = window.location.pathname
  const isProtectedArea = pathname.startsWith('/app') || pathname.startsWith('/platform')
  if (hadToken && isProtectedArea) {
    window.location.assign('/login')
  }
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return undefined
    }
  }

  try {
    const text = (await response.text()).trim()
    return text || undefined
  } catch {
    return undefined
  }
}

const client = createClient<paths>({
  baseUrl: apiBaseUrl,
  fetch: async (input: Request) => {
    const token = tokenStore.get()
    const headers = new Headers(input.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(new Request(input, { headers }))

    if (response.status === 401) {
      handle401(Boolean(token))
    }

    return response
  },
})

export class ApiError extends Error {
  status?: number
  payload?: unknown

  constructor(status?: number, payload?: unknown) {
    const message =
      (typeof payload === 'string' && payload) ||
      (payload as { error?: { message?: string } } | undefined)?.error?.message ||
      (payload as { detail?: string } | undefined)?.detail ||
      'Request failed'
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function requestWithAuth<T>(path: string, init: RequestInit): Promise<T> {
  const token = tokenStore.get()
  const headers = new Headers(init.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(withBase(path), { ...init, headers })

  if (response.status === 401) {
    handle401(Boolean(token))
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorPayload(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function requestPublic<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(withBase(path), { ...init, headers })

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorPayload(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function unwrap<T>(promise: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await promise
  if (error || !response.ok) {
    throw new ApiError(response?.status, error)
  }
  return data as T
}

export type AuthLoginRequest = paths['/auth/login']['post']['requestBody']['content']['application/json']
export type AuthTokenResponse = paths['/auth/login']['post']['responses']['200']['content']['application/json']
export type AuthMeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']

export type RegistrationPointCreateRequest =
  paths['/org/registration-points']['post']['requestBody']['content']['application/json']

export type DepartmentCreateRequest = paths['/org/departments']['post']['requestBody']['content']['application/json']

export type UserCreateRequest = paths['/org/users']['post']['requestBody']['content']['application/json']

export type SettingsUpdateRequest = paths['/org/settings']['put']['requestBody']['content']['application/json']
export type SettingsResponse = paths['/org/settings']['get']['responses']['200']['content']['application/json']

export type VisitQueryParams = paths['/org/visits']['get']['parameters']['query']

export type PublicCheckInRequest =
  paths['/public/p/{public_key}/checkin']['post']['requestBody']['content']['application/json']
export type PublicCheckInResponse =
  paths['/public/p/{public_key}/checkin']['post']['responses']['201']['content']['application/json']

type PublicCheckoutRequestBase =
  paths['/public/p/{public_key}/checkout']['post']['requestBody']['content']['application/json']

export type PublicCheckoutRequest = PublicCheckoutRequestBase & {
  feedback_opt_in?: boolean
  feedback_rating?: number | null
  feedback_was_helpful?: boolean | null
  feedback_visit_outcome?: 'completed_what_i_came_for' | 'partially_completed' | 'not_completed' | null
  feedback_comment?: string | null
}
export type PublicCheckoutResponse =
  paths['/public/p/{public_key}/checkout']['post']['responses']['200']['content']['application/json']

export type OrgInvitePublicOut = Record<string, unknown>

export type OrgInviteAcceptRequest = {
  org_name: string
  organization_slug: string
  password: string
  admin_full_name?: string
}

export type PlatformOrgInviteCreateRequest =
  paths['/platform/org-invites']['post']['requestBody']['content']['application/json']

export type PlatformOrgInviteListResponse =
  paths['/platform/org-invites']['get']['responses']['200']['content']['application/json']
export type PlatformOrgInviteResponse =
  paths['/platform/org-invites']['post']['responses']['200']['content']['application/json']
type PlatformOrgInviteListQuery = NonNullable<paths['/platform/org-invites']['get']['parameters']['query']>
export type PlatformOrgInviteListStatus = PlatformOrgInviteListQuery['status']

type PlatformOrganizationCreateRequestBase =
  paths['/platform/organizations']['post']['requestBody']['content']['application/json']
type PlatformOrganizationResponseBase =
  paths['/platform/organizations']['post']['responses']['200']['content']['application/json']

export type PlatformOrganizationCreateRequest = PlatformOrganizationCreateRequestBase & {
  company_image?: string | null
  primary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
}

export type PlatformOrganizationResponse = PlatformOrganizationResponseBase & {
  company_image?: string | null
  primary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
}

export type OrgBrandingResponse = {
  id: number
  name: string
  company_image: string | null
  primary_color: string | null
  accent_color: string | null
  background_color: string | null
  text_color: string | null
}

export type OrgBrandingUpdateRequest = {
  company_image?: string | null
  primary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
}

type PublicMutationOptions = {
  idempotencyKey?: string
}

// TODO: If any endpoint used below is missing from the OpenAPI contract, update the backend spec.
export const api = {
  authLogin: (body: AuthLoginRequest) => unwrap(client.POST('/auth/login', { body })),
  authMe: () => unwrap(client.GET('/auth/me', {})),

  getRegistrationPoints: () => unwrap(client.GET('/org/registration-points', {})),
  createRegistrationPoint: (body: RegistrationPointCreateRequest) =>
    unwrap(client.POST('/org/registration-points', { body })),

  getDepartments: () => unwrap(client.GET('/org/departments', {})),
  createDepartment: (body: DepartmentCreateRequest) => unwrap(client.POST('/org/departments', { body })),

  getUsers: () => unwrap(client.GET('/org/users', {})),
  createUser: (body: UserCreateRequest) => unwrap(client.POST('/org/users', { body })),

  getSettings: () => unwrap(client.GET('/org/settings', {})),
  updateSettings: (body: SettingsUpdateRequest) => unwrap(client.PUT('/org/settings', { body })),

  getVisits: (params?: VisitQueryParams) => unwrap(client.GET('/org/visits', { params: { query: params } })),
  getPersonHistory: (personId: number) =>
    unwrap(client.GET('/org/people/{personId}/history', { params: { path: { personId } } })),
  getAnalyticsSummary: () => unwrap(client.GET('/org/analytics/summary', {})),

  // TODO: Add typed wrapper for GET /public/p/{public_key} when backend contract includes it in OpenAPI.
  publicCheckIn: (publicKey: string, body: PublicCheckInRequest, options?: PublicMutationOptions) =>
    unwrap(
      client.POST('/public/p/{public_key}/checkin', {
        params: {
          path: { public_key: publicKey },
          header: options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
        },
        body,
      }),
    ),
  publicCheckout: (publicKey: string, body: PublicCheckoutRequest, options?: PublicMutationOptions) =>
    unwrap(
      client.POST('/public/p/{public_key}/checkout', {
        params: {
          path: { public_key: publicKey },
          header: options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
        },
        body,
      }),
    ),

  // OpenAPI fallback: these endpoints are called directly until backend contract includes them.
  getPublicOrgInvite: (token: string): Promise<OrgInvitePublicOut> =>
    requestPublic(`/public/org-invites/${encodeURIComponent(token)}`, { method: 'GET' }),
  acceptPublicOrgInvite: (token: string, body: OrgInviteAcceptRequest): Promise<AuthTokenResponse> =>
    requestPublic(`/public/org-invites/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createPlatformOrgInvite: (body: PlatformOrgInviteCreateRequest): Promise<PlatformOrgInviteResponse> =>
    unwrap(client.POST('/platform/org-invites', { body })),
  listPlatformOrgInvites: (status?: PlatformOrgInviteListStatus) =>
    unwrap(client.GET('/platform/org-invites', { params: status ? { query: { status } } : {} })),
  createPlatformOrganization: (body: PlatformOrganizationCreateRequest): Promise<PlatformOrganizationResponse> =>
    unwrap(client.POST('/platform/organizations', { body })) as Promise<PlatformOrganizationResponse>,
  listPlatformOrganizations: (): Promise<PlatformOrganizationResponse[]> =>
    unwrap(client.GET('/platform/organizations', {})) as Promise<PlatformOrganizationResponse[]>,
  getOrgBranding: (): Promise<OrgBrandingResponse> => requestWithAuth('/org/branding', { method: 'GET' }),
  updateOrgBranding: (body: OrgBrandingUpdateRequest): Promise<OrgBrandingResponse> =>
    requestWithAuth('/org/branding', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export const apiConfig = {
  apiBaseUrl,
}
