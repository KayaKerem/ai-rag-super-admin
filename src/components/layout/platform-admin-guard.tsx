import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/use-auth'

export function PlatformAdminGuard() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.isPlatformAdmin === true

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error('Bu sayfa için yetkiniz yok')
    }
  }, [user, isAdmin])

  if (!user) return null // AuthGuard handles login redirect
  if (!isAdmin) return <Navigate to="/" replace state={{ from: location }} />

  return <Outlet />
}
