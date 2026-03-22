import { useEffect, useState } from 'react'
import type { BrandingTheme } from '../../utils/branding'

export function WizardShell({
  orgName,
  logoUrl,
  theme,
  panelKey,
  children,
}: {
  orgName?: string
  logoUrl?: string | null
  theme: BrandingTheme
  panelKey: string
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [panelKey])

  return (
    <div className='mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:pt-10' style={{ color: theme.text_color }}>
      <header className='mb-6 rounded-2xl border bg-white/90 p-5 shadow-sm' style={{ borderColor: `${theme.primary_color}40` }}>
        <div className='flex items-center gap-4'>
          <div
            className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-slate-50 text-[10px] font-medium text-slate-500'
            style={{ borderColor: `${theme.accent_color}66` }}
          >
            {logoUrl ? <img src={logoUrl} alt='Organization logo' className='h-full w-full object-cover' /> : '<Organization Logo Here>'}
          </div>
          <div>
            <p className='text-sm' style={{ color: `${theme.text_color}B3` }}>{orgName || 'Organization'}</p>
            <h1 className='text-lg font-semibold' style={{ color: theme.text_color }}>Welcome. Please complete your check-in.</h1>
          </div>
        </div>
      </header>

      <section
        key={panelKey}
        className={`rounded-2xl border bg-white/95 p-5 shadow-sm transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
        style={{ borderColor: `${theme.primary_color}33` }}
      >
        {children}
      </section>
    </div>
  )
}
