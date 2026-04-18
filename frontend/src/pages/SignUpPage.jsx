import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../services/authService'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'

const SignUpPage = () => {
  const navigate = useNavigate()
  const { login: setUser } = useAuth()
  const { toast, showToast } = useToast()

  const [role, setRole] = useState('patient')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const inputStyle = {
    border: '1.5px solid #d0daea',
    background: '#f8f9fc',
    fontFamily: "'DM Sans', sans-serif",
  }
  const focusStyle = (e) => {
    e.target.style.borderColor = '#3a7bd5'
    e.target.style.background = 'white'
    e.target.style.boxShadow = '0 0 0 4px rgba(58,123,213,0.08)'
  }
  const blurStyle = (e) => {
    e.target.style.borderColor = '#d0daea'
    e.target.style.background = '#f8f9fc'
    e.target.style.boxShadow = 'none'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signup({ ...form, role })
      setUser(user)
      showToast('Account created! Welcome to MediCore.', 'success')
      setTimeout(() => navigate(user.role === 'doctor' ? '/doctor' : '/patient'), 600)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
      <Toast toast={toast} />

      <button onClick={() => navigate('/')}
        className="fixed top-6 left-8 flex items-center gap-1.5 text-sm text-[#4a5a6a] hover:text-[#3a7bd5] transition-colors">
        ← MediCore
      </button>

      <div className="w-full max-w-[900px] flex rounded-3xl overflow-hidden min-h-[600px]"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>

        {/* LEFT */}
        <div className="flex-1 p-14 flex flex-col justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
                style={{ background: 'rgba(255,255,255,0.15)' }}>✚</div>
              <span className="text-white text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                MediCore
              </span>
            </div>
            <h2 className="text-white text-[38px] font-medium leading-tight mb-4 tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Join thousands<br />finding better care.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Create your account in seconds and start connecting with specialists — or build your practice profile.
            </p>
            <div className="flex gap-2.5 mt-8">
              {['patient', 'doctor'].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className="px-4 py-2 rounded-full text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    color: role === r ? 'white' : 'rgba(255,255,255,0.6)',
                    background: role === r ? 'rgba(255,255,255,0.15)' : 'transparent',
                    borderColor: role === r ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  }}>
                  {r === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor'}
                </button>
              ))}
            </div>
            <div className="mt-10 space-y-3">
              {['Free to create an account', 'Instant appointment booking', 'Secure health records'].map(item => (
                <div key={item} className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="text-[#2ecc8a]">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 p-14 flex flex-col justify-center overflow-y-auto">
          <h3 className="text-[22px] font-semibold text-[#1a2a3a] mb-1.5">Create your account</h3>
          <p className="text-sm text-[#8a9ab0] mb-6">Joining as a <strong className="text-[#3a7bd5] capitalize">{role}</strong></p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([k, label]) => (
                <div key={k} className="flex-1">
                  <label className="block text-xs font-medium text-[#4a5a6a] mb-2 uppercase tracking-wide">{label}</label>
                  <input type="text" value={form[k]} onChange={set(k)} placeholder={label} required
                    className="w-full px-4 py-3 rounded-xl text-sm text-[#1a2a3a] outline-none transition-all duration-200"
                    style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              ))}
            </div>
            {[['email', 'Email Address', 'email', 'you@example.com'],
              ['phone', 'Phone Number', 'tel', '+91 00000 00000'],
              ['password', 'Password', 'password', '••••••••']].map(([k, label, type, ph]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-[#4a5a6a] mb-2 uppercase tracking-wide">{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} placeholder={ph}
                  required={k !== 'phone'}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[#1a2a3a] outline-none transition-all duration-200"
                  style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white border-none mt-1 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 6px 20px rgba(58,123,213,0.3)' }}>
              {loading ? 'Creating account…' : `Sign Up as ${role === 'patient' ? 'Patient' : 'Doctor'}`}
            </button>
          </form>

          <p className="text-center text-sm text-[#8a9ab0] mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-[#3a7bd5] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage