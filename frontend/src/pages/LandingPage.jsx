import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate = useNavigate()

  const handlePatientClick = () => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor' : '/patient')
    } else {
      navigate('/signin', { state: { role: 'patient' } })
    }
  }

  const handleDoctorClick = () => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor' : '/patient')
    } else {
      navigate('/signin', { state: { role: 'doctor' } })
    }
  }

  const features = [
    {
      icon: '🔍',
      title: 'Smart Doctor Search',
      desc: 'Find specialists by disease, symptom, or condition. Our intelligent search matches you with the right expert instantly.',
    },
    {
      icon: '📅',
      title: 'Seamless Scheduling',
      desc: 'Browse real-time availability and book appointments in seconds. No phone calls, no waiting on hold.',
    },
    {
      icon: '🏷️',
      title: 'Specialty Tag System',
      desc: 'Doctors are tagged by conditions they treat. Patients find exactly who they need — fast and accurately.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      desc: 'Your health data is protected with enterprise-grade encryption. Full HIPAA-compliant infrastructure.',
    },
    {
      icon: '📊',
      title: 'Practice Dashboard',
      desc: 'Doctors get a powerful overview of their schedule, patient flow, and ratings — all in one place.',
    },
    {
      icon: '⚡',
      title: 'Instant Confirmation',
      desc: 'Get real-time booking confirmations. Both patients and doctors are notified the moment an appointment is made.',
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #ffffff 0%, #eef3fc 40%, #dde8f5 100%)' }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-12"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e6ecf5' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}>
            ✚
          </div>
          <span className="text-[#2d5a8e] text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            MediCore
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#4a5a6a] border border-[#d0daea] bg-white hover:border-[#3a7bd5] hover:text-[#3a7bd5] transition-all duration-200"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white border-none transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 4px 12px rgba(58,123,213,0.3)' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="pt-16">
        <div className="flex items-center justify-between px-20 pt-20 pb-10 gap-16" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* LEFT */}
          <div className="flex-1 max-w-[520px]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-7"
              style={{ background: '#e8f0fb', border: '1px solid rgba(58,123,213,0.2)', color: '#3a7bd5' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc8a] animate-pulse" />
              Now live across India — 50+ specialists
            </div>
            <h1 className="text-[58px] font-medium leading-[1.05] text-[#1a2a3a] mb-5 tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Healthcare,<br />
              <em className="not-italic text-[#3a7bd5]">reimagined</em> for<br />
              everyone.
            </h1>
            <p className="text-base text-[#4a5a6a] leading-relaxed mb-9 font-light">
              Connect with top specialists, book appointments instantly, and manage your health journey — all in one beautifully simple platform.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handlePatientClick}
                className="px-7 py-3.5 rounded-xl text-[15px] font-medium text-white border-none transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 6px 20px rgba(58,123,213,0.35)' }}
              >
                I'm a Patient →
              </button>
              <button
                onClick={handleDoctorClick}
                className="px-7 py-3.5 rounded-xl text-[15px] font-medium text-[#2d5a8e] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ border: '1.5px solid #d0daea' }}
              >
                I'm a Doctor
              </button>
            </div>
          </div>

          {/* RIGHT — hero cards */}
          <div className="flex-1 max-w-[500px] relative h-[380px]">
            {/* Main card */}
            <div className="absolute top-0 left-0 w-full rounded-2xl p-6 bg-white"
              style={{ boxShadow: '0 8px 40px rgba(45,90,142,0.12)', border: '1px solid #e6ecf5' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}>
                  👨‍⚕️
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1a2a3a]">Dr. Arun Mehta</h4>
                  <span className="text-xs text-[#8a9ab0]">Cardiologist · Apollo Hospital</span>
                </div>
                <div className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
                  ★ 4.9
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {['Heart Failure', 'Arrhythmia', 'Hypertension'].map(t => (
                  <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {['9:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'].map((s, i) => (
                  <div key={s} className="py-1.5 px-1 rounded-lg text-center text-[11px] font-medium transition-all cursor-pointer"
                    style={i === 1
                      ? { background: '#e6f9f2', color: '#1a9e6a', border: '1px solid rgba(46,204,138,0.2)' }
                      : { background: '#e6ecf5', color: '#8a9ab0' }}>
                    {s}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4">
                {[['14', 'Patients/day'], ['8', 'Yrs Exp'], ['62', 'This Month']].map(([n, l]) => (
                  <div key={l} className="flex-1 bg-[#f8f9fc] rounded-xl p-3 text-center">
                    <div className="text-[22px] font-semibold text-[#2d5a8e]">{n}</div>
                    <div className="text-[10px] text-[#8a9ab0] uppercase tracking-wide">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating card */}
            <div className="absolute bottom-5 right-[-20px] w-[200px] rounded-2xl p-4 bg-white animate-bounce"
              style={{ boxShadow: '0 8px 40px rgba(45,90,142,0.12)', border: '1px solid #e6ecf5', animationDuration: '4s' }}>
              <div className="text-xs font-semibold text-[#4a5a6a] mb-2">Upcoming</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}>
                  👩‍⚕️
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1a2a3a]">Dr. Priya Sinha</div>
                  <div className="text-[10px] text-[#8a9ab0]">Tomorrow, 9:00 AM</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] font-medium px-2 py-1 rounded-full inline-block"
                style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
                ✓ Confirmed
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-3 gap-5 px-20 pb-20" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {features.map((f) => (
            <div key={f.title}
              className="bg-white rounded-2xl p-7 border border-[#e6ecf5] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group cursor-default"
              style={{ boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
              <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(90deg, #3a7bd5, #2d5a8e)' }} />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-4"
                style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[#1a2a3a] mb-2">{f.title}</h3>
              <p className="text-[13px] text-[#4a5a6a] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* FOOTER STRIP */}
        <div className="border-t border-[#e6ecf5] px-20 py-8 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.6)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}>
              ✚
            </div>
            <span className="text-[#2d5a8e] text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              MediCore
            </span>
          </div>
          <p className="text-xs text-[#8a9ab0]">© 2025 MediCore. Built for better healthcare.</p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage