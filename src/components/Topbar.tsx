import { useAuth } from '../auth/AuthContext'
import { useOrgBranding } from '../hooks/useOrgBranding'
import { Button } from './Button'

export function Topbar() {
  const { logout, user } = useAuth()
  const theme = useOrgBranding()

  const orgName = theme.name
  const logoUrl = theme.company_image || ''

  return (
    <header
      className='flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/80 px-6 py-4 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between'
      style={{ borderColor: `${theme.primary_color}66` }}
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[9px] font-semibold uppercase tracking-widest text-slate-400'>
          {logoUrl ? <img src={logoUrl} alt={`${orgName} logo`} className='h-full w-full object-cover' /> : 'Logo'}
        </div>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>{orgName}</p>
          <h1 className='text-lg font-semibold text-slate-900'>Visitor Registration</h1>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='text-right text-sm text-slate-600'>
          <p className='font-medium text-slate-900'>{user?.full_name || user?.email || 'Signed in'}</p>
          <p className='text-xs text-slate-400'>{user?.email}</p>
        </div>
        <Button variant='secondary' onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
