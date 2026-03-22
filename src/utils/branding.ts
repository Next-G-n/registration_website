type BrandingLike = {
  name?: string | null
  company_image?: string | null
  primary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
}

export type BrandingTheme = {
  name: string
  company_image: string | null
  primary_color: string
  accent_color: string
  background_color: string
  text_color: string
}

export const DEFAULT_BRANDING_THEME: BrandingTheme = {
  name: 'Organization',
  company_image: null,
  primary_color: '#0A84FF',
  accent_color: '#22C55E',
  background_color: '#F8FAFC',
  text_color: '#0F172A',
}

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const candidate = String(value || '').trim()
  if (!HEX_COLOR_PATTERN.test(candidate)) return fallback
  return `#${candidate.slice(1).toUpperCase()}`
}

function normalizeBackground(value: string | null | undefined, fallback: string) {
  const candidate = String(value || '').trim()
  if (!candidate) return fallback
  if (HEX_COLOR_PATTERN.test(candidate)) {
    return `#${candidate.slice(1).toUpperCase()}`
  }
  return candidate
}

export function normalizeBrandingTheme(input?: BrandingLike | null, fallbackName?: string): BrandingTheme {
  const themeName = String(input?.name || '').trim() || fallbackName || DEFAULT_BRANDING_THEME.name
  const companyImage = String(input?.company_image || '').trim() || null

  return {
    name: themeName,
    company_image: companyImage,
    primary_color: normalizeHexColor(input?.primary_color, DEFAULT_BRANDING_THEME.primary_color),
    accent_color: normalizeHexColor(input?.accent_color, DEFAULT_BRANDING_THEME.accent_color),
    background_color: normalizeBackground(input?.background_color, DEFAULT_BRANDING_THEME.background_color),
    text_color: normalizeHexColor(input?.text_color, DEFAULT_BRANDING_THEME.text_color),
  }
}
