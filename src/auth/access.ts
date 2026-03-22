import type { AuthMeResponse } from '../api/client'

export type UserRole = NonNullable<AuthMeResponse['role']>

export const ROLE = {
  PLATFORM_SUPER_ADMIN: 'platform_super_admin',
  ORG_ADMIN: 'org_admin',
  STAFF: 'staff',
} as const satisfies Record<string, UserRole>

export function getDefaultRouteForRole(role?: UserRole | null) {
  if (role === ROLE.PLATFORM_SUPER_ADMIN) return '/platform/invites'
  return '/app/dashboard'
}

