import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'

export function AuthGuard() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user?.isPlatformAdmin) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
