import { useAuth } from '../auth/AuthContext'
import { useOrgBranding } from '../hooks/useOrgBranding'
import { Button } from './Button'

export function Topbar({ onMobileMenuOpen }: { onMobileMenuOpen?: () => void }) {
  const { logout, user } = useAuth()
  const theme = useOrgBranding()

  const orgName = theme.name
  const logoUrl = theme.company_image || ''

  return (
    <header className='topbar-shell flex items-center justify-between gap-4 px-4 py-4 md:px-6'>
      <div className='flex min-w-0 items-center gap-3'>
        <button
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 lg:hidden'
          onClick={onMobileMenuOpen}
          aria-label='Open menu'
        >
          <svg width='18' height='18' viewBox='0 0 18 18' fill='none'>
            <path d='M3 5h12M3 9h12M3 13h8' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' />
          </svg>
        </button>

        <div className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 text-[9px] font-semibold uppercase tracking-widest text-slate-400 shadow-sm'>
          {logoUrl ? <img src={logoUrl} alt={`${orgName} logo`} className='h-full w-full object-cover' /> : 'Logo'}
        </div>

        <div className='min-w-0'>
          <p className='truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500'>{orgName}</p>
          <h1 className='truncate text-base font-semibold text-slate-900 md:text-lg'>Visitor Registration</h1>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-3'>
        <div className='hidden rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2 text-right text-sm shadow-sm md:block'>
          <p className='font-medium text-slate-900'>{user?.full_name || user?.email || 'Signed in'}</p>
          <p className='text-xs text-slate-500'>{user?.email}</p>
        </div>
        <Button variant='secondary' size='sm' onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
