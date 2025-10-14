import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '@/providers/AuthProvider'

type RequireSuperuserProps = {
  children: ReactNode
}

const RequireSuperuser = ({ children }: RequireSuperuserProps) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-muted/40 bg-panel/70">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (!user?.is_superuser) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RequireSuperuser
