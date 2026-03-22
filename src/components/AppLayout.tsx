import { type CSSProperties } from 'react'
import { Outlet } from 'react-router-dom'
import { ROLE } from '../auth/access'
import { useAuth } from '../auth/AuthContext'
import { useOrgBranding } from '../hooks/useOrgBranding'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { user } = useAuth()
  const isOrgUser = user?.role === ROLE.ORG_ADMIN || user?.role === ROLE.STAFF
  const theme = useOrgBranding()

  const themedStyle = isOrgUser
    ? ({
        background: theme.background_color,
        color: theme.text_color,
        ['--brand-primary' as string]: theme.primary_color,
        ['--brand-accent' as string]: theme.accent_color,
        ['--brand-text' as string]: theme.text_color,
        ['--brand-text-soft' as string]: `${theme.text_color}CC`,
        ['--brand-text-muted' as string]: `${theme.text_color}99`,
        ['--brand-primary-soft' as string]: `${theme.primary_color}33`,
        ['--brand-accent-soft' as string]: `${theme.accent_color}22`,
      } as CSSProperties)
    : undefined

  return (
    <div className={isOrgUser ? 'org-theme min-h-screen' : 'min-h-screen'} style={themedStyle}>
      <div className='mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 md:px-6'>
        <Sidebar />
        <div className='flex w-full flex-1 flex-col gap-6'>
          <Topbar />
          <main className='flex-1'>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
