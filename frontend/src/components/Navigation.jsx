import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-frost h-16 flex items-center justify-between px-12 shadow-nav">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-deep-blue flex items-center justify-center text-sm text-white font-semibold">
          ✦
        </div>
        <span className="font-serif text-2xl font-semibold text-deep-blue tracking-tight">MediCore</span>
      </Link>

      {/* Tabs */}
      <div className="flex gap-1">
        <Link to="/" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/') ? 'bg-accent-light text-accent' : 'text-text-mid hover:text-accent'}`}>
          Home
        </Link>
        {user?.role === 'patient' && (
          <Link to="/patient" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/patient') ? 'bg-accent-light text-accent' : 'text-text-mid hover:text-accent'}`}>
            Patient Portal
          </Link>
        )}
        {user?.role === 'doctor' && (
          <Link to="/doctor" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/doctor') ? 'bg-accent-light text-accent' : 'text-text-mid hover:text-accent'}`}>
            Doctor Portal
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive('/admin') ? 'bg-accent-light text-accent' : 'text-text-mid hover:text-accent'}`}>
            Admin Dashboard
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        {isAuthenticated && user ? (
          <>
            <span className="text-xs font-medium text-text-light px-3 py-2">
              {user.role === 'doctor' ? `Dr. ${user.name}` : user.name}
            </span>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-xs font-medium border-1.5 border-silver bg-white text-text-mid hover:border-accent hover:text-accent transition-all">
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/signin" className="px-4 py-2 rounded-lg text-xs font-medium border-1.5 border-silver bg-white text-text-mid hover:border-accent hover:text-accent transition-all">
              Sign In
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-accent to-deep-blue shadow-lg shadow-accent/30 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
