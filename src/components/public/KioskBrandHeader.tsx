import type { BrandingTheme } from '../../utils/branding'

export function KioskBrandHeader({
  theme,
  orgName,
  logoUrl,
  title,
  subtitle,
  registrationPointName,
}: {
  theme: BrandingTheme
  orgName: string
  logoUrl?: string | null
  title: string
  subtitle?: string
  registrationPointName?: string | null
}) {
  return (
    <header className='rounded-2xl border bg-white/90 p-5 shadow-sm' style={{ borderColor: `${theme.primary_color}40` }}>
      <div className='flex items-center gap-4'>
        <div
          className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-slate-50 text-[10px] font-medium text-slate-500'
          style={{ borderColor: `${theme.accent_color}66` }}
        >
          {logoUrl ? <img src={logoUrl} alt={`${orgName} logo`} className='h-full w-full object-cover' /> : 'Logo'}
        </div>
        <div>
          <p className='text-sm' style={{ color: `${theme.text_color}B3` }}>{orgName}</p>
          <h1 className='text-lg font-semibold' style={{ color: theme.text_color }}>{title}</h1>
          {subtitle ? <p className='mt-1 text-sm' style={{ color: `${theme.text_color}CC` }}>{subtitle}</p> : null}
          {registrationPointName ? (
            <p className='mt-1 text-xs' style={{ color: `${theme.text_color}99` }}>
              {registrationPointName}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
