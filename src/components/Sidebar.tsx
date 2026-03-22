import { NavLink } from 'react-router-dom'
import { ROLE, type UserRole } from '../auth/access'
import { useAuth } from '../auth/AuthContext'
import { useOrgBranding } from '../hooks/useOrgBranding'
import { cn } from '../utils/cn'

type NavItem = {
  to: string
  label: string
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/app/registration-points', label: 'Registration Points', roles: [ROLE.ORG_ADMIN] },
  { to: '/app/departments', label: 'Departments', roles: [ROLE.ORG_ADMIN] },
  { to: '/app/users', label: 'Users', roles: [ROLE.ORG_ADMIN] },
  { to: '/app/settings', label: 'Settings', roles: [ROLE.ORG_ADMIN] },
  { to: '/app/visits', label: 'Visits', roles: [ROLE.ORG_ADMIN, ROLE.STAFF] },
  { to: '/app/reports', label: 'Dashboard & Reports', roles: [ROLE.ORG_ADMIN, ROLE.STAFF] },
  { to: '/app/analytics', label: 'Analytics', roles: [ROLE.ORG_ADMIN, ROLE.STAFF] },
  { to: '/platform/invites', label: 'Platform Invites', roles: [ROLE.PLATFORM_SUPER_ADMIN] },
]

export function Sidebar() {
  const { user } = useAuth()
  const items = navItems.filter((item) => (user?.role ? item.roles.includes(user.role) : false))
  const theme = useOrgBranding()

  const orgName = theme.name
  const logoUrl = theme.company_image || ''

  return (
    <aside
      className='hidden w-64 flex-col gap-6 rounded-3xl border p-5 shadow-xl backdrop-blur lg:flex'
      style={{ borderColor: `${theme.primary_color}40`, background: theme.background_color }}
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[8px] font-semibold uppercase tracking-widest text-slate-400'>
          {logoUrl ? <img src={logoUrl} alt={`${orgName} logo`} className='h-full w-full object-cover' /> : 'Logo'}
        </div>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Visitor Portal</p>
          <h2 className='mt-1 text-sm font-semibold text-slate-900'>{orgName}</h2>
        </div>
      </div>

      <nav className='flex flex-1 flex-col gap-1'>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100',
                isActive && 'text-white shadow-md',
              )
            }
            style={({ isActive }) => (isActive ? { backgroundColor: theme.primary_color } : undefined)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs text-slate-500' style={{ borderColor: `${theme.primary_color}33` }}>
        {user?.role === ROLE.PLATFORM_SUPER_ADMIN
          ? 'Platform admins can create and manage onboarding invites.'
          : 'Org admins can manage kiosks and staff. Staff can view visits and analytics.'}
      </div>
    </aside>
  )
}
