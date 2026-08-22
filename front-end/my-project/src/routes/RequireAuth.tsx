import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/domain'

interface RequireAuthProps {
  allowedRoles?: UserRole[]
}

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, user, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
