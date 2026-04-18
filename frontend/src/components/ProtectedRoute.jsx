import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
          <p className="text-[#8a9ab0] text-sm font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/signin" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />
  }

  return children
}

export default ProtectedRoute