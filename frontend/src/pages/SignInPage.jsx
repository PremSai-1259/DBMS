import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { login } from '../services/authService'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'

const SignInPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: setUser } = useAuth()
  const { toast, showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await login(email, password)
      setUser(user)
      
      // Extract first name from full name or use name directly
      const displayName = user.firstName || user.name?.split(' ')[0] || user.name
      showToast(`Welcome back, ${displayName}!`, 'success')
      
      // Route based on user role
      const redirectPath = 
        user.role === 'doctor' ? '/doctor' :
        user.role === 'admin' ? '/admin' :
        '/patient'
      
      setTimeout(() => {
        navigate(redirectPath)
      }, 500)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
      <Toast toast={toast} />

      {/* Back to home */}
      <button onClick={() => navigate('/')}
        className="fixed top-6 left-8 flex items-center gap-1.5 text-sm text-[#4a5a6a] hover:text-[#3a7bd5] transition-colors">
        ← MediCore
      </button>

      <div className="w-full max-w-[900px] flex rounded-3xl overflow-hidden min-h-[580px]"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>

        {/* LEFT PANEL */}
        <div className="flex-1 p-14 flex flex-col justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                ✚
              </div>
              <span className="text-white text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                MediCore
              </span>
            </div>
            <h2 className="text-white text-[40px] font-medium leading-tight mb-4 tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Your health,<br />our priority.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Sign in to access your personalized dashboard, manage appointments, and connect with top specialists.
            </p>
            {/* Role pills - Display only, for UI reference */}
            <div className="flex gap-2.5 mt-8 flex-wrap">
              {['patient', 'doctor', 'admin'].map((r) => (
                <div key={r}
                  className="px-4 py-2 rounded-full text-xs font-medium capitalize transition-all duration-200 opacity-50 cursor-default"
                  style={{
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.6)',
                    background: 'transparent',
                  }}>
                  {r === 'patient' ? '👤 Patient' : r === 'admin' ? '🔐 Admin' : '👨‍⚕️ Doctor'}
                </div>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-3">Role determined by account type</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 p-14 flex flex-col justify-center">
          <h3 className="text-[22px] font-semibold text-[#1a2a3a] mb-1.5">
            Sign In
          </h3>
          <p className="text-sm text-[#8a9ab0] mb-8">
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4a5a6a] mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-[#1a2a3a] outline-none transition-all duration-200"
                style={{
                  border: '1.5px solid #d0daea',
                  background: '#f8f9fc',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => { e.target.style.borderColor = '#3a7bd5'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(58,123,213,0.08)' }}
                onBlur={e => { e.target.style.borderColor = '#d0daea'; e.target.style.background = '#f8f9fc'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5a6a] mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-[#1a2a3a] outline-none transition-all duration-200"
                style={{
                  border: '1.5px solid #d0daea',
                  background: '#f8f9fc',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => { e.target.style.borderColor = '#3a7bd5'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(58,123,213,0.08)' }}
                onBlur={e => { e.target.style.borderColor = '#d0daea'; e.target.style.background = '#f8f9fc'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white border-none mt-1 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 6px 20px rgba(58,123,213,0.3)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8a9ab0] mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#3a7bd5] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignInPage