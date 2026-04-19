import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'
import ScheduleManager from '../components/ScheduleManager'
import { getAppointments } from '../services/appointmentService'
import { profileService } from '../services/profileService'
import { slotService } from '../services/slotService'

const TAG_OPTIONS = [
  { label: 'Coronary Artery', emoji: '❤️' },
  { label: 'Valvular Disease', emoji: '🫀' },
  { label: 'Heart Transplant', emoji: '💉' },
  { label: 'Pacemaker', emoji: '⚡' },
  { label: 'Peripheral Artery', emoji: '🩸' },
  { label: 'Congenital Heart', emoji: '🫁' },
  { label: 'Cardiac Imaging', emoji: '📷' },
  { label: 'Stress Testing', emoji: '🏃' },
  { label: 'Preventive Cardio', emoji: '🛡️' },
  { label: 'Migraine', emoji: '🧠' },
  { label: 'Epilepsy', emoji: '⚡' },
  { label: 'Sleep Apnea', emoji: '😴' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast, showToast } = useToast()

  // Approval status state
  const [approvalStatus, setApprovalStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)

  // Dashboard state
  const [tab, setTab] = useState('overview')
  const [appointments, setAppointments] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const [tagSubmitted, setTagSubmitted] = useState(false)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Load approval status on mount
  useEffect(() => {
    checkApprovalStatus()
  }, [])

  // Load dashboard data only if approved
  useEffect(() => {
    if (approvalStatus?.status === 'approved') {
      loadAll()
    }
  }, [approvalStatus])

  const checkApprovalStatus = async () => {
    setStatusLoading(true)
    try {
      const res = await profileService.getApprovalStatus()
      setApprovalStatus(res.data)
    } catch (err) {
      console.error('Failed to check approval status:', err)
      showToast('Failed to load profile status', 'error')
    } finally {
      setStatusLoading(false)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [apptData, profileData] = await Promise.allSettled([
        getAppointments(),
        profileService.getProfile(),
      ])
      if (apptData.status === 'fulfilled') setAppointments(apptData.value)
      if (profileData.status === 'fulfilled') setProfile(profileData.value?.data)

      try {
        const slotsRes = await slotService.getAllSlots()
        setSlots(slotsRes?.data || [])
      } catch { /* slots optional */ }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user ? `${user.name || user.firstName || ''}` : 'Doctor'

  const specialization = approvalStatus?.doctorProfile?.specialization || 'Pending Verification'

  // =====================================================
  // PENDING APPROVAL VIEW
  // =====================================================
  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin mx-auto mb-4" />
          <p className="text-[#4a5a6a]">Loading profile status...</p>
        </div>
      </div>
    )
  }

  if (approvalStatus?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
        <Toast toast={toast} />
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-semibold text-[#1a2a3a] mb-2">
              Profile Under Review
            </h2>
            <p className="text-sm text-[#8a9ab0] mb-6">
              Your doctor profile and credentials are currently being reviewed by our admin team. This typically takes 24-48 hours.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-medium text-[#3a7bd5] mb-3">📋 Profile Details:</p>
              <div className="space-y-2 text-xs text-[#4a5a6a]">
                <div className="flex justify-between">
                  <span className="font-medium">Specialization:</span>
                  <span>{approvalStatus?.doctorProfile?.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Experience:</span>
                  <span>{approvalStatus?.doctorProfile?.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hospital:</span>
                  <span>{approvalStatus?.doctorProfile?.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Submitted:</span>
                  <span>{new Date(approvalStatus?.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-medium text-[#1a9e6a] mb-2">✓ What happens next:</p>
              <ul className="text-xs text-[#4a5a6a] space-y-1">
                <li>• Admin verifies your credentials</li>
                <li>• Certificate validation</li>
                <li>• Profile approval</li>
                <li>• Email notification sent to {user?.email}</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#4a5a6a] border border-[#e6ecf5] hover:bg-[#f8f9fc] transition-all">
                Sign Out
              </button>
              <button onClick={checkApprovalStatus}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}>
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (approvalStatus?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
        <Toast toast={toast} />
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-semibold text-[#e53e3e] mb-2">
              Profile Rejected
            </h2>
            <p className="text-sm text-[#8a9ab0] mb-6">
              Your doctor profile could not be approved at this time. Please review the feedback below and reapply.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-medium text-[#e53e3e] mb-2">📝 Admin Feedback:</p>
              <p className="text-sm text-[#4a5a6a]">
                {approvalStatus?.adminMessage || 'No specific feedback provided'}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-medium text-[#b07a00] mb-2">💡 What to do next:</p>
              <ul className="text-xs text-[#4a5a6a] space-y-1">
                <li>• Review the feedback above</li>
                <li>• Update your certificate or credentials</li>
                <li>• Contact support for clarification</li>
                <li>• Reapply with updated information</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#4a5a6a] border border-[#e6ecf5] hover:bg-[#f8f9fc] transition-all">
                Sign Out
              </button>
              <button onClick={() => navigate('/doctor-profile')}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}>
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =====================================================
  // APPROVED DASHBOARD VIEW
  // =====================================================
  if (approvalStatus?.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
        <div className="text-center">
          <p className="text-[#4a5a6a]">Profile status unknown. Please try again.</p>
        </div>
      </div>
    )
  }

  const todayAppts = appointments.filter(a => {
    if (!a.date && !a.slot?.date) return false
    const d = new Date(a.date || a.slot?.date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length
  const thisMonth = appointments.filter(a => {
    const d = new Date(a.date || a.slot?.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const handleTagToggle = (label) => {
    setSelectedTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label])
    setTagSubmitted(false)
  }

  const handleTagSubmit = () => {
    if (selectedTags.length === 0) { showToast('Select at least one tag', 'warning'); return }
    setTagSubmitted(true)
    showToast(`${selectedTags.length} tag request(s) submitted!`, 'success')
  }

  const navItems = [
    { key: 'overview', icon: '🏠', label: 'Overview' },
    { key: 'tags', icon: '🏷️', label: 'Manage Tags' },
    { key: 'schedule', icon: '📅', label: 'Schedule' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
      <Toast toast={toast} />

      {/* TOP NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-8"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e6ecf5' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}>✚</div>
          <span className="text-[#2d5a8e] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            MediCore
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
            ✓ Approved
          </span>
          <span className="text-sm text-[#4a5a6a]">Dr. {displayName.split(' ')[1] || displayName.split(' ')[0]}</span>
          <button onClick={handleLogout}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-[#4a5a6a] hover:text-[#3a7bd5] hover:bg-[#e8f0fb] transition-all">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="flex pt-16 min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-[240px] flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] bg-white flex flex-col"
          style={{ borderRight: '1px solid #e6ecf5' }}>
          <div className="p-5 pb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2.5"
              style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}>
              👨‍⚕️
            </div>
            <h4 className="text-[15px] font-semibold text-[#1a2a3a]">Dr. {displayName}</h4>
            <span className="text-xs text-[#8a9ab0]">{specialization}</span>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {navItems.map(item => (
              <button key={item.key}
                onClick={() => setTab(item.key)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-left transition-all duration-200"
                style={tab === item.key ? { background: '#e8f0fb', color: '#3a7bd5' } : { color: '#4a5a6a' }}>
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-3">
            <button onClick={handleLogout}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#4a5a6a] w-full hover:bg-[#f8f9fc] transition-all">
              <span className="text-base w-5 text-center">🚪</span> Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 px-10 py-8 overflow-y-auto">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#1a2a3a]">
                  Good morning, Dr. {displayName.split(' ').slice(-1)[0]} 👋
                </h2>
                <p className="text-sm text-[#8a9ab0] mt-1">Here's your practice summary for today</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { icon: '👥', val: todayAppts.length || '—', label: "Today's Patients" },
                  { icon: '⭐', val: '4.9', label: 'Rating' },
                  { icon: '✅', val: confirmedCount, label: 'Confirmed' },
                  { icon: '📆', val: thisMonth, label: 'This Month' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 flex flex-col items-center text-center"
                    style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="text-2xl font-bold text-[#2d5a8e]">{s.val}</div>
                    <div className="text-[11px] text-[#8a9ab0] uppercase tracking-wide mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Today's schedule */}
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4">
                  Today's Schedule{' '}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
                    {todayAppts.length} appointments
                  </span>
                </h3>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
                  </div>
                ) : todayAppts.length === 0 ? (
                  <div className="text-center py-8 text-[#8a9ab0]">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-sm">No appointments scheduled for today</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todayAppts.map(apt => {
                      const patientName = apt.patient?.name || apt.patientName || 'Patient'
                      const time = apt.slot?.time || apt.time || '—'
                      const notes = apt.notes || apt.reason || 'Consultation'
                      return (
                        <div key={apt.id || apt._id}
                          className="flex items-center gap-4 py-3 px-4 rounded-xl"
                          style={{ background: '#f8f9fc', border: '1px solid #e6ecf5' }}>
                          <div className="text-sm font-semibold text-[#6b8cba] w-20 flex-shrink-0">{time}</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#1a2a3a]">{patientName}</div>
                            <div className="text-xs text-[#8a9ab0]">{notes}</div>
                          </div>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                            style={apt.status === 'confirmed'
                              ? { background: '#e6f9f2', color: '#1a9e6a' }
                              : { background: '#fff8e6', color: '#b07a00' }}>
                            {apt.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* All appointments */}
              {!loading && appointments.length > 0 && (
                <div className="bg-white rounded-2xl p-6 mt-5" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4">All Appointments</h3>
                  <div className="flex flex-col gap-2">
                    {appointments.slice(0, 10).map(apt => {
                      const patientName = apt.patient?.name || apt.patientName || 'Patient'
                      const time = apt.slot?.time || apt.time || '—'
                      const date = apt.date || apt.slot?.date
                      const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'
                      return (
                        <div key={apt.id || apt._id}
                          className="flex items-center gap-4 py-3 px-4 rounded-xl"
                          style={{ background: '#f8f9fc', border: '1px solid #e6ecf5' }}>
                          <div className="text-xs text-[#6b8cba] w-24 flex-shrink-0">{dateStr} · {time}</div>
                          <div className="flex-1 text-sm font-medium text-[#1a2a3a]">{patientName}</div>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                            style={apt.status === 'confirmed' || apt.status === 'completed'
                              ? { background: '#e6f9f2', color: '#1a9e6a' }
                              : apt.status === 'cancelled'
                              ? { background: '#fef0f0', color: '#e53e3e' }
                              : { background: '#fff8e6', color: '#b07a00' }}>
                            {apt.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAGS */}
          {tab === 'tags' && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#1a2a3a]">Specialty Tags</h2>
                <p className="text-sm text-[#8a9ab0] mt-1">Request tags that match your expertise — they help patients find you</p>
              </div>

              {/* Active tags */}
              <div className="bg-white rounded-2xl p-6 mb-5"
                style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                <h3 className="text-sm font-semibold text-[#1a2a3a] mb-1">Your Active Tags</h3>
                <p className="text-xs text-[#8a9ab0] mb-4">Approved tags appear on your public profile</p>
                <div className="flex flex-wrap gap-2">
                  {['Heart Failure', 'Arrhythmia', 'Hypertension'].map(t => (
                    <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
                      ✓ {t}
                    </span>
                  ))}
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: '#fff8e6', color: '#b07a00' }}>
                    ⏳ Valvular Disease
                  </span>
                </div>
              </div>

              {/* Request new tags */}
              <div className="bg-white rounded-2xl p-6"
                style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                <h3 className="text-sm font-semibold text-[#1a2a3a] mb-1">Request New Tags</h3>
                <p className="text-xs text-[#8a9ab0] mb-5">Select conditions you want to be listed under. Reviewed by admin.</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {TAG_OPTIONS.map(tag => (
                    <button key={tag.label}
                      onClick={() => handleTagToggle(tag.label)}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                      style={selectedTags.includes(tag.label)
                        ? { background: '#e8f0fb', color: '#3a7bd5', border: '1.5px solid #3a7bd5' }
                        : { background: '#f8f9fc', color: '#4a5a6a', border: '1.5px solid #e6ecf5' }}>
                      <span className="text-lg">{tag.emoji}</span>
                      <span className="text-[13px]">{tag.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleTagSubmit}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 4px 12px rgba(58,123,213,0.25)' }}>
                    Submit Request
                  </button>
                  {tagSubmitted && (
                    <span className="text-sm text-[#1a9e6a]">✓ {selectedTags.length} request(s) submitted for review</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE */}
          {tab === 'schedule' && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#1a2a3a]">Manage Schedule</h2>
                <p className="text-sm text-[#8a9ab0] mt-1">Set your availability across 24 daily slots (8 AM - 9 PM with lunch break)</p>
              </div>

              {/* Date picker - Weekly view */}
              <div className="bg-white rounded-2xl p-6 mb-6"
                style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4">Select Date</h3>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() + i)
                    const dateStr = date.toISOString().split('T')[0]
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNum = date.getDate()
                    const isSelected = dateStr === selectedScheduleDate

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedScheduleDate(dateStr)}
                        className="flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200"
                        style={isSelected
                          ? { background: '#e8f0fb', border: '2px solid #3a7bd5' }
                          : { background: '#f8f9fc', border: '1px solid #e6ecf5' }}>
                        <div className="text-[11px] font-semibold mb-1" style={{ color: isSelected ? '#3a7bd5' : '#4a5a6a' }}>
                          {dayName.toUpperCase()}
                        </div>
                        <div className="text-lg font-bold" style={{ color: isSelected ? '#3a7bd5' : '#1a2a3a' }}>
                          {dayNum}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Schedule Manager Component */}
              <div className="bg-white rounded-2xl p-6"
                style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                <ScheduleManager selectedDate={selectedScheduleDate} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DoctorDashboard
