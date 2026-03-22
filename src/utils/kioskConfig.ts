type DepartmentOption = {
  id: number
  label: string
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const defaultDepartments: DepartmentOption[] = [
  { id: 1, label: 'Front Desk' },
]

const defaultPurposes = ['Meeting', 'Interview', 'Delivery', 'Service', 'Other']

const defaultCountries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Angola',
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Botswana',
  'Brazil',
  'Cameroon',
  'Canada',
  'China',
  'Democratic Republic of the Congo',
  'Egypt',
  'Ethiopia',
  'France',
  'Germany',
  'Ghana',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Kenya',
  'Lesotho',
  'Malawi',
  'Mozambique',
  'South Africa',
  'Namibia',
  'Nigeria',
  'Pakistan',
  'Portugal',
  'Rwanda',
  'Saudi Arabia',
  'Seychelles',
  'Singapore',
  'Spain',
  'Sweden',
  'Switzerland',
  'Tanzania',
  'Uganda',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Zambia',
  'Zimbabwe',
  'Other',
]

export function getKioskDepartments() {
  // TODO: Use GET /public/p/{public_key} once backend adds it to OpenAPI.
  const raw = parseJson<Array<{ id?: number; label?: string; name?: string }>>(
    import.meta.env.VITE_KIOSK_DEPARTMENTS,
    [],
  )
  const normalized = raw
    .map((item) => ({
      id: Number(item.id),
      label: String(item.label || item.name || '').trim(),
    }))
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.label.length > 0)
  return normalized.length ? normalized : defaultDepartments
}

export function getKioskPurposes() {
  const raw = parseJson<string[]>(import.meta.env.VITE_KIOSK_PURPOSES, [])
  const normalized = raw.map((item) => String(item || '').trim()).filter(Boolean)
  return normalized.length ? normalized : defaultPurposes
}

export function getKioskCountries() {
  const raw = parseJson<string[]>(import.meta.env.VITE_KIOSK_COUNTRIES, [])
  const normalized = raw.map((item) => String(item || '').trim()).filter(Boolean)
  return normalized.length ? normalized : defaultCountries
}
