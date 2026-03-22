import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ROLE } from '../auth/access'
import { useAuth } from '../auth/AuthContext'
import { useOrgBranding } from '../hooks/useOrgBranding'
import { buildBrandCssVars } from '../utils/branding'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isOrgUser = user?.role === ROLE.ORG_ADMIN || user?.role === ROLE.STAFF
  const theme = useOrgBranding()

  return (
    <div
      className={isOrgUser ? 'org-theme relative min-h-screen overflow-hidden' : 'relative min-h-screen overflow-hidden'}
      style={buildBrandCssVars(theme)}
    >
      <div
        className='pointer-events-none absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full blur-3xl'
        style={{ background: `${theme.primary_color}22` }}
      />
      <div
        className='pointer-events-none absolute right-[-140px] top-10 h-96 w-96 rounded-full blur-3xl'
        style={{ background: `${theme.accent_color}20` }}
      />

      <div className='relative mx-auto flex min-h-screen max-w-[1500px] gap-8 px-4 py-6 md:px-6 lg:px-8 lg:py-8'>
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <div className='flex w-full min-w-0 flex-1 flex-col gap-6'>
          <Topbar onMobileMenuOpen={() => setMobileMenuOpen(true)} />
          <main className='flex-1 animate-fade-up'>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
