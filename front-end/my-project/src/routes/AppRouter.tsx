import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AppShell } from '../components/layout/AppShell'
import { AdminAnalyticsPage } from '../pages/AdminAnalyticsPage'
import { ClubsPage } from '../pages/ClubsPage'
import { ContractsPage } from '../pages/ContractsPage'
import { DashboardHomePage } from '../pages/DashboardHomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlayerSelfServicePage } from '../pages/PlayerSelfServicePage'
import { PlayersPage } from '../pages/PlayersPage'
import { PublicCatalogPage } from '../pages/PublicCatalogPage'
import { PublicPlayerProfilePage } from '../pages/PublicPlayerProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { GuestOnlyRoute } from './GuestOnlyRoute'
import { RequireAuth } from './RequireAuth'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>
      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardHomePage />} />
          <Route
            path="admin/analytics"
            element={<RequireAuth allowedRoles={['admin']} />}
          >
            <Route index element={<AdminAnalyticsPage />} />
          </Route>
          <Route
            path="players"
            element={<RequireAuth allowedRoles={['admin', 'club_staff']} />}
          >
            <Route index element={<PlayersPage />} />
          </Route>
          <Route
            path="clubs"
            element={<RequireAuth allowedRoles={['admin', 'club_staff']} />}
          >
            <Route index element={<ClubsPage />} />
          </Route>
          <Route
            path="contracts"
            element={<RequireAuth allowedRoles={['admin', 'club_staff']} />}
          >
            <Route index element={<ContractsPage />} />
          </Route>
          <Route
            path="my-profile"
            element={<RequireAuth allowedRoles={['player']} />}
          >
            <Route index element={<PlayerSelfServicePage />} />
          </Route>
          <Route path="catalog" element={<PublicCatalogPage />} />
          <Route path="catalog/players/:playerId" element={<PublicPlayerProfilePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
