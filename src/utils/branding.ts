import type { CSSProperties } from 'react'

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function relativeLuminance(channel: number) {
  const normalized = channel / 255
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

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

export function mixHexColors(first: string, second: string, ratio = 0.5) {
  const safeRatio = clamp(ratio, 0, 1)
  const a = hexToRgb(normalizeHexColor(first, DEFAULT_BRANDING_THEME.primary_color))
  const b = hexToRgb(normalizeHexColor(second, DEFAULT_BRANDING_THEME.primary_color))
  return rgbToHex(
    a.r * (1 - safeRatio) + b.r * safeRatio,
    a.g * (1 - safeRatio) + b.g * safeRatio,
    a.b * (1 - safeRatio) + b.b * safeRatio,
  )
}

export function getContrastTextColor(background: string, dark = '#081120', light = '#FFFFFF') {
  const safeBackground = normalizeHexColor(background, DEFAULT_BRANDING_THEME.primary_color)
  const { r, g, b } = hexToRgb(safeBackground)
  const luminance =
    0.2126 * relativeLuminance(r) +
    0.7152 * relativeLuminance(g) +
    0.0722 * relativeLuminance(b)

  return luminance > 0.45 ? dark : light
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

export function buildBrandCssVars(theme: BrandingTheme): CSSProperties {
  const primaryStrong = mixHexColors(theme.primary_color, '#081120', 0.22)
  const accentStrong = mixHexColors(theme.accent_color, '#0F172A', 0.38)
  const actionColor = mixHexColors(theme.primary_color, '#0F172A', 0.58)
  const actionHoverColor = mixHexColors(theme.primary_color, '#020617', 0.68)
  const secondarySurface = mixHexColors(theme.accent_color, '#FFFFFF', 0.78)
  const secondarySurfaceHover = mixHexColors(theme.accent_color, '#FFFFFF', 0.68)
  const secondaryBorder = mixHexColors(theme.accent_color, '#94A3B8', 0.34)
  const secondaryBorderHover = mixHexColors(theme.accent_color, '#64748B', 0.48)
  const secondaryText = mixHexColors(theme.accent_color, '#0F172A', 0.74)
  const primarySoft = mixHexColors(theme.primary_color, '#FFFFFF', 0.78)
  const primaryMuted = mixHexColors(theme.primary_color, '#FFFFFF', 0.9)
  const accentSoft = mixHexColors(theme.accent_color, '#FFFFFF', 0.78)
  const accentMuted = mixHexColors(theme.accent_color, '#FFFFFF', 0.9)
  const surfaceEdge = mixHexColors(theme.primary_color, '#CBD5E1', 0.18)
  const surfaceTop = mixHexColors(theme.primary_color, '#FFFFFF', 0.94)
  const surfaceBottom = mixHexColors(theme.accent_color, '#FFFFFF', 0.95)
  const fieldBorder = mixHexColors(theme.primary_color, '#CBD5E1', 0.24)
  const fieldBg = mixHexColors(theme.accent_color, '#FFFFFF', 0.96)

  return {
    background: theme.background_color,
    color: theme.text_color,
    ['--brand-primary' as string]: theme.primary_color,
    ['--brand-accent' as string]: theme.accent_color,
    ['--brand-text' as string]: theme.text_color,
    ['--brand-text-soft' as string]: `${theme.text_color}CC`,
    ['--brand-text-muted' as string]: `${theme.text_color}99`,
    ['--brand-primary-soft' as string]: primarySoft,
    ['--brand-primary-muted' as string]: primaryMuted,
    ['--brand-primary-strong' as string]: primaryStrong,
    ['--brand-accent-soft' as string]: accentSoft,
    ['--brand-accent-muted' as string]: accentMuted,
    ['--brand-accent-strong' as string]: accentStrong,
    ['--brand-on-primary' as string]: getContrastTextColor(actionColor),
    ['--brand-action' as string]: actionColor,
    ['--brand-action-hover' as string]: actionHoverColor,
    ['--brand-secondary-surface' as string]: secondarySurface,
    ['--brand-secondary-surface-hover' as string]: secondarySurfaceHover,
    ['--brand-secondary-border' as string]: secondaryBorder,
    ['--brand-secondary-border-hover' as string]: secondaryBorderHover,
    ['--brand-secondary-text' as string]: secondaryText,
    ['--brand-surface-edge' as string]: surfaceEdge,
    ['--brand-surface-top' as string]: surfaceTop,
    ['--brand-surface-bottom' as string]: surfaceBottom,
    ['--brand-field-border' as string]: fieldBorder,
    ['--brand-field-bg' as string]: fieldBg,
  }
}
