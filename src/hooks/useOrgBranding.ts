import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { ROLE } from '../auth/access'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_BRANDING_THEME, normalizeBrandingTheme, type BrandingTheme } from '../utils/branding'

/**
 * Returns the branding theme for the logged-in org user's organization.
 * If the user is not logged in or is not an org user, returns DEFAULT_BRANDING_THEME.
 */
export function useOrgBranding(): BrandingTheme {
  const { user } = useAuth()
  const isOrgUser = user?.role === ROLE.ORG_ADMIN || user?.role === ROLE.STAFF

  const { data } = useQuery({
    queryKey: ['org-branding'],
    queryFn: api.getOrgBranding,
    enabled: isOrgUser,
    staleTime: 60_000,
  })

  if (!isOrgUser) return DEFAULT_BRANDING_THEME
  return normalizeBrandingTheme(data)
}
