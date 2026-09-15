import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const currentUser = useAuthStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to={ROUTES.login} replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const currentUser = useAuthStore((s) => s.currentUser)
  if (currentUser) return <Navigate to={ROUTES.dashboard} replace />
  return <Outlet />
}
