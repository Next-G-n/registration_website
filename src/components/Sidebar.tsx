import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { ROLE, type UserRole } from '../auth/access'
import { useAuth } from '../auth/AuthContext'
import { useOrgBranding } from '../hooks/useOrgBranding'
import { cn } from '../utils/cn'

type NavSection = 'activity' | 'manage' | 'platform'

type NavItem = {
  to: string
  label: string
  roles: UserRole[]
  section: NavSection
}

const navItems: NavItem[] = [
  { to: '/app/visits', label: 'Visits', roles: [ROLE.ORG_ADMIN, ROLE.STAFF], section: 'activity' },
  { to: '/app/reports', label: 'Dashboard & Reports', roles: [ROLE.ORG_ADMIN, ROLE.STAFF], section: 'activity' },
  { to: '/app/analytics', label: 'Analytics', roles: [ROLE.ORG_ADMIN, ROLE.STAFF], section: 'activity' },
  { to: '/app/registration-points', label: 'Registration Points', roles: [ROLE.ORG_ADMIN], section: 'manage' },
  { to: '/app/departments', label: 'Departments', roles: [ROLE.ORG_ADMIN], section: 'manage' },
  { to: '/app/users', label: 'Users', roles: [ROLE.ORG_ADMIN], section: 'manage' },
  { to: '/app/settings', label: 'Settings', roles: [ROLE.ORG_ADMIN], section: 'manage' },
  { to: '/platform/invites', label: 'Platform Invites', roles: [ROLE.PLATFORM_SUPER_ADMIN], section: 'platform' },
]

const SECTION_LABELS: Partial<Record<NavSection, string>> = {
  manage: 'Management',
  platform: 'Platform',
}

function SidebarContent({
  items,
  orgName,
  logoUrl,
  onLinkClick,
}: {
  items: NavItem[]
  orgName: string
  logoUrl: string
  onLinkClick?: () => void
}) {
  return (
    <div className='flex h-full flex-col gap-5 p-5 text-white'>
      <div className='rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-[8px] font-semibold uppercase tracking-widest text-white/45'>
            {logoUrl ? <img src={logoUrl} alt={`${orgName} logo`} className='h-full w-full object-cover' /> : 'Logo'}
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50'>Visitor portal</p>
            <h2 className='truncate text-lg font-semibold text-white'>{orgName}</h2>
          </div>
        </div>
      </div>

      <div className='px-1'>
        <p className='text-xs uppercase tracking-[0.32em] text-white/35'>Navigation</p>
      </div>

      <nav className='flex flex-1 flex-col gap-1'>
        {items.map((item, index) => {
          const prevSection = index > 0 ? items[index - 1].section : item.section
          const sectionChanged = index > 0 && item.section !== prevSection
          const sectionLabel = sectionChanged ? SECTION_LABELS[item.section] : undefined

          return (
            <Fragment key={item.to}>
              {sectionLabel && (
                <p className='mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35'>
                  {sectionLabel}
                </p>
              )}
              <NavLink
                to={item.to}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  cn(
                    'rounded-2xl border px-4 py-3 text-sm font-medium transition duration-150',
                    isActive
                      ? 'border-white/10 bg-white text-slate-950 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.9)]'
                      : 'border-transparent text-white/70 hover:border-white/10 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            </Fragment>
          )
        })}
      </nav>

      <div className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/55'>
        Visitor management, reporting, and kiosk operations in one place.
      </div>
    </div>
  )
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const { user } = useAuth()
  const items = navItems.filter((item) => (user?.role ? item.roles.includes(user.role) : false))
  const theme = useOrgBranding()
  const orgName = theme.name
  const logoUrl = theme.company_image || ''

  return (
    <>
      <aside className='sidebar-shell hidden w-72 shrink-0 flex-col lg:sticky lg:top-8 lg:flex lg:max-h-[calc(100vh-4rem)]'>
        <SidebarContent items={items} orgName={orgName} logoUrl={logoUrl} />
      </aside>

      {mobileOpen && (
        <div className='fixed inset-0 z-50 flex lg:hidden'>
          <div className='animate-fade-in-bg absolute inset-0 bg-slate-900/50 backdrop-blur-sm' onClick={onMobileClose} />

          <aside className='sidebar-shell animate-slide-in-left relative flex w-80 flex-col rounded-r-3xl'>
            <button
              onClick={onMobileClose}
              className='absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white'
              aria-label='Close menu'
            >
              <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
                <path d='M12 4L4 12M4 4l8 8' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' />
              </svg>
            </button>

            <SidebarContent items={items} orgName={orgName} logoUrl={logoUrl} onLinkClick={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  )
}
