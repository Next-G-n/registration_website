import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { ROLE } from './auth/access'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/portal/LoginPage'
import { RegistrationPointsPage } from './pages/portal/RegistrationPointsPage'
import { DepartmentsPage } from './pages/portal/DepartmentsPage'
import { UsersPage } from './pages/portal/UsersPage'
import { VisitsPage } from './pages/portal/VisitsPage'
import { PersonHistoryPage } from './pages/portal/PersonHistoryPage'
import { AnalyticsPage } from './pages/portal/AnalyticsPage'
import { ReportsPage } from './pages/portal/ReportsPage'
import { SettingsPage } from './pages/portal/SettingsPage'
import { PublicLandingPage } from './pages/public/PublicLandingPage'
import { PublicCheckInWizardPage } from './pages/public/PublicCheckInWizardPage'
import { PublicCheckOutPage } from './pages/public/PublicCheckOutPage'
import { InvitePage } from './pages/public/InvitePage'
import { PlatformInvitesPage } from './pages/platform/PlatformInvitesPage'
import { NotFoundPage } from './pages/NotFoundPage'

const orgRoles = [ROLE.ORG_ADMIN, ROLE.STAFF]
const orgAdminRoles = [ROLE.ORG_ADMIN]
const platformRoles = [ROLE.PLATFORM_SUPER_ADMIN]

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/p/:publicKey',
    element: <PublicLandingPage />,
  },
  {
    path: '/p/:publicKey/checkin',
    element: <PublicCheckInWizardPage />,
  },
  {
    path: '/public/checkin/:public_key',
    element: <PublicCheckInWizardPage />,
  },
  {
    path: '/p/:publicKey/checkout',
    element: <PublicCheckOutPage />,
  },
  {
    path: '/invite/:token',
    element: <InvitePage />,
  },
  {
    path: '/platform',
    element: (
      <ProtectedRoute allowedRoles={platformRoles}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to='/platform/invites' replace /> },
      { path: 'invites', element: <PlatformInvitesPage /> },
    ],
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute allowedRoles={orgRoles}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to='/app/reports' replace /> },
      { path: 'dashboard', element: <Navigate to='/app/reports' replace /> },
      {
        path: 'registration-points',
        element: (
          <ProtectedRoute allowedRoles={orgAdminRoles}>
            <RegistrationPointsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'departments',
        element: (
          <ProtectedRoute allowedRoles={orgAdminRoles}>
            <DepartmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={orgAdminRoles}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={orgAdminRoles}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      { path: 'visits', element: <VisitsPage /> },
      { path: 'people/:personId', element: <PersonHistoryPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
  {
    path: '/',
    element: <Navigate to='/login' replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
