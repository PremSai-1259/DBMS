import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'
import ScheduleManager from '../components/ScheduleManager'
import PatientProfileModal from '../components/PatientProfileModal'
import DoctorAccessReports from '../components/DoctorAccessReports'
import { getAppointments, addConsultationNote, updateConsultationNote, doctorCancelAppointment } from '../services/appointmentService'
import { profileService } from '../services/profileService'
import { slotService } from '../services/slotService'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatLocalDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [consultationAppointment, setConsultationAppointment] = useState(null)
  const [consultationSaving, setConsultationSaving] = useState(false)
  const [cancelAppointmentTarget, setCancelAppointmentTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSaving, setCancelSaving] = useState(false)
  const [consultationForm, setConsultationForm] = useState({
    reasonForVisit: '',
    diagnosis: '',
    prescription: '',
    additionalNotes: '',
  })
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    const today = new Date()
    return formatLocalDateKey(today)
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
        const slotsRes = await slotService.getDoctorAvailableSlots(user?.id)
        setSlots(slotsRes?.data || [])
      } catch { /* slots optional */ }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const openConsultationModal = (appointment) => {
    setConsultationAppointment(appointment)
    setConsultationForm({
      reasonForVisit: appointment.consultation?.reasonForVisit || '',
      diagnosis: appointment.consultation?.diagnosis || '',
      prescription: appointment.consultation?.prescription || '',
      additionalNotes: appointment.consultation?.additionalNotes || '',
    })
  }

  const closeConsultationModal = () => {
    setConsultationAppointment(null)
    setConsultationForm({
      reasonForVisit: '',
      diagnosis: '',
      prescription: '',
      additionalNotes: '',
    })
  }

  const openCancelModal = (appointment) => {
    setCancelAppointmentTarget(appointment)
    setCancelReason('')
  }

  const closeCancelModal = (force = false) => {
    if (cancelSaving && !force) return
    setCancelAppointmentTarget(null)
    setCancelReason('')
  }

  const handleConsultationChange = (field) => (event) => {
    setConsultationForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const saveConsultation = async () => {
    if (!consultationAppointment?.id) return

    setConsultationSaving(true)
    try {
      if (consultationAppointment.consultation?.id) {
        await updateConsultationNote(consultationAppointment.consultation.id, consultationForm)
        showToast('Consultation notes updated', 'success')
      } else {
        await addConsultationNote(consultationAppointment.id, consultationForm)
        showToast('Consultation notes saved and appointment marked completed', 'success')
      }

      closeConsultationModal()
      await loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setConsultationSaving(false)
    }
  }

  const cancelDoctorAppointment = async () => {
    if (!cancelAppointmentTarget?.id || !cancelReason.trim()) {
      showToast('Please provide a cancellation reason', 'error')
      return
    }

    setCancelSaving(true)
    closeCancelModal(true)
    try {
      await doctorCancelAppointment(cancelAppointmentTarget.id, cancelReason)
      setAppointments((prev) => prev.filter((apt) => apt.id !== cancelAppointmentTarget.id))
      showToast('Appointment cancelled and patient notified', 'success')
      await loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCancelSaving(false)
    }
  }

  const doctorName = (() => {
    const candidates = [
      [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim(),
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
      profile?.name?.trim(),
      user?.name?.trim(),
    ].filter(Boolean)

    const realName = candidates.find(name => name && name.toLowerCase() !== 'doctor')
    return realName || candidates[0] || 'Doctor'
  })()

  const specialization = approvalStatus?.doctorProfile?.specialization || 'Pending Verification'
  const getAppointmentStart = (appointment) => {
    const dateValue = appointment.date || appointment.slot?.date
    const timeValue = appointment.slot?.startTime || appointment.slotStartTime

    if (!dateValue) return null

    const parsed = new Date(timeValue ? `${dateValue}T${timeValue}` : dateValue)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const getAppointmentEnd = (appointment) => {
    const dateValue = appointment.date || appointment.slot?.date
    const timeValue = appointment.slot?.endTime || appointment.slotEndTime || appointment.slot?.startTime || appointment.slotStartTime

    if (!dateValue) return null

    const parsed = new Date(timeValue ? `${dateValue}T${timeValue}` : dateValue)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

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
    const d = getAppointmentStart(a)
    if (!d) return false
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length
  const thisMonth = appointments.filter(a => {
    const d = getAppointmentStart(a)
    if (!d) return false
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const now = new Date()
  const upcomingAppts = appointments.filter(a => {
    const d = getAppointmentStart(a)
    return a.status === 'confirmed' && d && d >= now
  }).sort((a, b) => getAppointmentStart(a) - getAppointmentStart(b))

  const pendingConsultationAppts = appointments.filter(a => {
    const d = getAppointmentEnd(a)
    return a.status === 'confirmed' && d && d < now
  }).sort((a, b) => getAppointmentStart(b) - getAppointmentStart(a))

  const completedAppts = appointments.filter(a => a.status === 'completed')
    .sort((a, b) => getAppointmentStart(b) - getAppointmentStart(a))

  const pastAppts = appointments.filter(a => a.status === 'cancelled')
    .sort((a, b) => getAppointmentStart(b) - getAppointmentStart(a)) // Newest first

  const upcomingSlots = (slots || []).filter(slot => {
    if (!slot?.slotDate || !slot?.slotStartTime) return false

    const slotStart = new Date(`${slot.slotDate}T${slot.slotStartTime}`)
    return !Number.isNaN(slotStart.getTime()) && slotStart >= now
  }).sort((a, b) => {
    const first = new Date(`${a.slotDate}T${a.slotStartTime}`)
    const second = new Date(`${b.slotDate}T${b.slotStartTime}`)
    return first - second
  })

  const navItems = [
    { key: 'overview', icon: '🏠', label: 'Overview' },
    { key: 'access-reports', icon: '📋', label: 'Access Reports' },
    { key: 'schedule', icon: '📅', label: 'Schedule' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
      <Toast toast={toast} />
      {selectedPatientId && (
        <PatientProfileModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
      {consultationAppointment && (
        <ConsultationModal
          appointment={consultationAppointment}
          form={consultationForm}
          saving={consultationSaving}
          onChange={handleConsultationChange}
          onClose={closeConsultationModal}
          onSave={saveConsultation}
        />
      )}
      {cancelAppointmentTarget && (
        <CancelAppointmentModal
          appointment={cancelAppointmentTarget}
          reason={cancelReason}
          saving={cancelSaving}
          onReasonChange={setCancelReason}
          onClose={closeCancelModal}
          onCancel={cancelDoctorAppointment}
        />
      )}

      {/* TOP NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-8"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e6ecf5' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}>✚</div>
          <span className="text-[#2d5a8e] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Patient Centric Data Governance and Appointment Platform
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
            ✓ Approved
          </span>
          <span className="text-sm text-[#4a5a6a]">Dr. {doctorName}</span>
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
            <h4 className="text-[15px] font-semibold text-[#1a2a3a]">Dr. {doctorName}</h4>
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
                  Hi, Dr. {doctorName} 👋
                </h2>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: '👥', val: todayAppts.length || '—', label: "Today's Patients" },
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

              {/* Upcoming Appointments */}
              {!loading && upcomingAppts.length > 0 && (
                <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4 flex items-center gap-2">
                    <span>📅 Upcoming Appointments</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
                      {upcomingAppts.length}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {upcomingAppts.slice(0, 10).map(apt => {
                      const patientName = apt.patient?.name || apt.patientName || 'Patient'
                      const patientEmail = apt.patient?.email || apt.patientEmail || ''
                      const time = apt.slot?.time || apt.time || '—'
                      const date = apt.date || apt.slot?.date
                      const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
                      return (
                        <div key={apt.id || apt._id}
                          className="flex items-center gap-4 py-3 px-4 rounded-xl"
                          style={{ background: '#f0f7ff', border: '1px solid #c9dff0' }}>
                          <div className="text-xs font-medium text-[#3a7bd5] w-28 flex-shrink-0 bg-white px-2.5 py-1.5 rounded-lg">{dateStr} · {time}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1a2a3a]">{patientName}</div>
                            {patientEmail && (
                              <div className="text-xs text-[#8a9ab0] mt-0.5 truncate">{patientEmail}</div>
                            )}
                          </div>
                          {apt.patientId && (
                            <button
                              onClick={() => setSelectedPatientId(apt.patientId)}
                              className="rounded-xl px-3 py-2 text-xs font-medium text-[#3a7bd5] transition-all duration-200 hover:bg-white"
                              style={{ border: '1px solid #c9dff0' }}
                            >
                              View Patient
                            </button>
                          )}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => openCancelModal(apt)}
                              className="rounded-xl px-3 py-2 text-xs font-medium text-[#e53e3e] transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ border: '1px solid #f3c1c1' }}
                              disabled={cancelSaving}
                            >
                              Cancel
                            </button>
                          )}
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                            style={apt.status === 'confirmed' 
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

              {!loading && upcomingSlots.length > 0 && (
                <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4 flex items-center gap-2">
                    <span>Upcoming Available Slots</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
                      {upcomingSlots.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {upcomingSlots.slice(0, 12).map(slot => {
                      const slotDateTime = new Date(`${slot.slotDate}T${slot.slotStartTime}`)
                      const dateStr = slotDateTime.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                      const startTime = new Date(`${slot.slotDate}T${slot.slotStartTime}`).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                      const endTime = new Date(`${slot.slotDate}T${slot.slotEndTime}`).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })

                      return (
                        <div key={slot.id}
                          className="rounded-xl p-4"
                          style={{ background: '#f4fbf7', border: '1px solid #d7f0e3' }}>
                          <div className="text-xs font-semibold uppercase tracking-wide text-[#1a9e6a] mb-2">
                            Available
                          </div>
                          <div className="text-sm font-semibold text-[#1a2a3a]">{dateStr}</div>
                          <div className="text-sm text-[#4a5a6a] mt-1">{startTime} - {endTime}</div>
                          <div className="text-xs text-[#8a9ab0] mt-2">Slot #{slot.slotNumber}</div>
                        </div>
                      )
                    })}
                  </div>
                  {upcomingSlots.length > 12 && (
                    <div className="text-xs text-[#8a9ab0] text-center mt-4 pt-4 border-t border-[#e6ecf5]">
                      Showing 12 of {upcomingSlots.length} upcoming available slots
                    </div>
                  )}
                </div>
              )}

              {!loading && pendingConsultationAppts.length > 0 && (
                <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4 flex items-center gap-2">
                    <span>Pending Consultation Notes</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#fff8e6', color: '#b07a00' }}>
                      {pendingConsultationAppts.length}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {pendingConsultationAppts.slice(0, 10).map(apt => {
                      const patientName = apt.patient?.name || apt.patientName || 'Patient'
                      const patientEmail = apt.patient?.email || apt.patientEmail || ''
                      const time = apt.slot?.time || apt.time || 'â€”'
                      const date = apt.date || apt.slot?.date
                      const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'â€”'
                      return (
                        <div key={apt.id || apt._id}
                          className="flex items-center gap-4 py-3 px-4 rounded-xl"
                          style={{ background: '#fffaf0', border: '1px solid #f3dfb0' }}>
                          <div className="text-xs text-[#8a9ab0] min-w-[180px] flex-shrink-0">{dateStr} Â· {time}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#4a5a6a]">{patientName}</div>
                            {patientEmail && (
                              <div className="text-xs text-[#8a9ab0] mt-0.5 truncate">{patientEmail}</div>
                            )}
                          </div>
                          {apt.patientId && (
                            <button
                              onClick={() => setSelectedPatientId(apt.patientId)}
                              className="rounded-xl px-3 py-2 text-xs font-medium text-[#3a7bd5] transition-all duration-200 hover:bg-white"
                              style={{ border: '1px solid #d7e3f3' }}
                            >
                              View Patient
                            </button>
                          )}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => openCancelModal(apt)}
                              className="rounded-xl px-3 py-2 text-xs font-medium text-[#e53e3e] transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ border: '1px solid #f3c1c1' }}
                              disabled={cancelSaving}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => openConsultationModal(apt)}
                            className="rounded-xl px-3 py-2 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-px"
                            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}
                          >
                            Write Notes
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!loading && completedAppts.length > 0 && (
                <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4 flex items-center gap-2">
                    <span>Completed Appointments</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
                      {completedAppts.length}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {completedAppts.slice(0, 12).map(apt => {
                      const patientName = apt.patient?.name || apt.patientName || 'Patient'
                      const patientEmail = apt.patient?.email || apt.patientEmail || ''
                      const time = apt.slot?.time || apt.time || 'â€”'
                      const date = apt.date || apt.slot?.date
                      const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'â€”'

                      return (
                        <div key={apt.id || apt._id}
                          className="rounded-xl border border-[#d7f0e3] bg-[#f4fbf7] px-4 py-4">
                          <div className="flex items-start gap-4">
                            <div className="text-xs font-medium text-[#1a9e6a] min-w-[180px] flex-shrink-0 rounded-lg bg-white px-2.5 py-1.5">
                              {dateStr} Â· {time}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#1a2a3a]">{patientName}</div>
                              {patientEmail && (
                                <div className="text-xs text-[#8a9ab0] mt-0.5 truncate">{patientEmail}</div>
                              )}
                              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="rounded-lg bg-white px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Reason For Visit</div>
                                  <div className="mt-1 text-sm text-[#4a5a6a]">{apt.consultation?.reasonForVisit || 'â€”'}</div>
                                </div>
                                <div className="rounded-lg bg-white px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Diagnosis</div>
                                  <div className="mt-1 text-sm text-[#4a5a6a]">{apt.consultation?.diagnosis || 'â€”'}</div>
                                </div>
                                <div className="rounded-lg bg-white px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Prescription</div>
                                  <div className="mt-1 text-sm text-[#4a5a6a] whitespace-pre-wrap">{apt.consultation?.prescription || 'â€”'}</div>
                                </div>
                                <div className="rounded-lg bg-white px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Additional Notes</div>
                                  <div className="mt-1 text-sm text-[#4a5a6a] whitespace-pre-wrap">{apt.consultation?.additionalNotes || 'â€”'}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {apt.patientId && (
                                <button
                                  onClick={() => setSelectedPatientId(apt.patientId)}
                                  className="rounded-xl px-3 py-2 text-xs font-medium text-[#3a7bd5] transition-all duration-200 hover:bg-white"
                                  style={{ border: '1px solid #c9dff0' }}
                                >
                                  View Patient
                                </button>
                              )}
                              <button
                                onClick={() => openConsultationModal(apt)}
                                className="rounded-xl px-3 py-2 text-xs font-medium text-[#1a9e6a] transition-all duration-200 hover:bg-white"
                                style={{ border: '1px solid #cce8d9' }}
                              >
                                Edit Notes
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Past Appointments */}
              {!loading && pastAppts.length > 0 && (
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <h3 className="text-sm font-semibold text-[#1a2a3a] mb-4 flex items-center gap-2">
                    <span>📋 Past Appointments</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#f5f5f5', color: '#6b8cba' }}>
                      {pastAppts.length}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {pastAppts.slice(0, 15).map(apt => {
                      const patientName = apt.patient?.name || apt.patientName || 'Patient'
                      const patientEmail = apt.patient?.email || apt.patientEmail || ''
                      const time = apt.slot?.time || apt.time || '—'
                      const date = apt.date || apt.slot?.date
                      const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
                      return (
                        <div key={apt.id || apt._id}
                          className="flex items-center gap-4 py-3 px-4 rounded-xl"
                          style={{ background: '#fafbfc', border: '1px solid #e6ecf5' }}>
                          <div className="text-xs text-[#8a9ab0] w-28 flex-shrink-0">{dateStr} · {time}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#4a5a6a]">{patientName}</div>
                            {patientEmail && (
                              <div className="text-xs text-[#8a9ab0] mt-0.5 truncate">{patientEmail}</div>
                            )}
                          </div>
                          {apt.patientId && (
                            <button
                              onClick={() => setSelectedPatientId(apt.patientId)}
                              className="rounded-xl px-3 py-2 text-xs font-medium text-[#3a7bd5] transition-all duration-200 hover:bg-white"
                              style={{ border: '1px solid #d7e3f3' }}
                            >
                              View Patient
                            </button>
                          )}
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
                  {pastAppts.length > 15 && (
                    <div className="text-xs text-[#8a9ab0] text-center mt-3 pt-3 border-t border-[#e6ecf5]">
                      Showing 15 of {pastAppts.length} appointments
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!loading && upcomingAppts.length === 0 && pendingConsultationAppts.length === 0 && completedAppts.length === 0 && pastAppts.length === 0 && upcomingSlots.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-[#8a9ab0]">No appointments or upcoming slots yet</p>
                </div>
              )}
            </div>
          )}

          {/* ACCESS REPORTS */}
          {tab === 'access-reports' && (
            <DoctorAccessReports />
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
                    const dateStr = formatLocalDateKey(date)
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

const ConsultationModal = ({ appointment, form, saving, onChange, onClose, onSave }) => {
  const patientName = appointment?.patient?.name || appointment?.patientName || 'Patient'
  const patientEmail = appointment?.patient?.email || appointment?.patientEmail || ''
  const time = appointment?.slot?.time || appointment?.time || '—'
  const date = appointment?.date || appointment?.slot?.date
  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 40, 80, 0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-8"
        style={{ boxShadow: '0 30px 80px rgba(20, 40, 80, 0.24)' }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#1a2a3a]">
              {appointment?.consultation?.id ? 'Edit Consultation Notes' : 'Write Consultation Notes'}
            </h3>
            <p className="mt-1 text-sm text-[#8a9ab0]">
              {patientName} · {dateStr} · {time}
            </p>
            {patientEmail && <p className="mt-1 text-sm text-[#8a9ab0]">{patientEmail}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#4a5a6a] transition-all duration-200 hover:bg-[#f8f9fc]"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8a9ab0]">Reason For Visit</span>
            <textarea
              value={form.reasonForVisit}
              onChange={onChange('reasonForVisit')}
              rows={4}
              className="w-full rounded-2xl border border-[#d0daea] bg-[#f8f9fc] px-4 py-3 text-sm text-[#1a2a3a] outline-none transition-all duration-200 focus:border-[#3a7bd5] focus:bg-white"
              placeholder="Describe the patient's concern or chief complaint"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8a9ab0]">Diagnosis</span>
            <textarea
              value={form.diagnosis}
              onChange={onChange('diagnosis')}
              rows={4}
              className="w-full rounded-2xl border border-[#d0daea] bg-[#f8f9fc] px-4 py-3 text-sm text-[#1a2a3a] outline-none transition-all duration-200 focus:border-[#3a7bd5] focus:bg-white"
              placeholder="Write your diagnosis or findings"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8a9ab0]">Prescription</span>
            <textarea
              value={form.prescription}
              onChange={onChange('prescription')}
              rows={4}
              className="w-full rounded-2xl border border-[#d0daea] bg-[#f8f9fc] px-4 py-3 text-sm text-[#1a2a3a] outline-none transition-all duration-200 focus:border-[#3a7bd5] focus:bg-white"
              placeholder="Medicines, dosage, and instructions"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8a9ab0]">Additional Notes</span>
            <textarea
              value={form.additionalNotes}
              onChange={onChange('additionalNotes')}
              rows={4}
              className="w-full rounded-2xl border border-[#d0daea] bg-[#f8f9fc] px-4 py-3 text-sm text-[#1a2a3a] outline-none transition-all duration-200 focus:border-[#3a7bd5] focus:bg-white"
              placeholder="Follow-up steps, advice, or other observations"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#d0daea] px-4 py-2.5 text-sm font-medium text-[#4a5a6a] transition-all duration-200 hover:bg-[#f8f9fc]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}
          >
            {saving
              ? 'Saving...'
              : appointment?.consultation?.id
              ? 'Update Notes'
              : 'Save Notes & Complete Appointment'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CancelAppointmentModal = ({ appointment, reason, saving, onReasonChange, onClose, onCancel }) => {
  const patientName = appointment?.patient?.name || appointment?.patientName || 'Patient'
  const patientEmail = appointment?.patient?.email || appointment?.patientEmail || ''
  const time = appointment?.slot?.time || appointment?.time || '—'
  const date = appointment?.date || appointment?.slot?.date
  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 40, 80, 0.45)', backdropFilter: 'blur(6px)', cursor: saving ? 'wait' : 'default' }}
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-8"
        style={{ boxShadow: '0 30px 80px rgba(20, 40, 80, 0.24)' }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#1a2a3a]">
              Cancel Appointment
            </h3>
            <p className="mt-1 text-sm text-[#8a9ab0]">
              {patientName} · {dateStr} · {time}
            </p>
            {patientEmail && <p className="mt-1 text-sm text-[#8a9ab0]">{patientEmail}</p>}
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#4a5a6a] transition-all duration-200 hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <div className="rounded-2xl border border-[#f1d6d6] bg-[#fff7f7] px-4 py-3 text-sm text-[#b94a48]">
          The patient will be notified automatically with the reason you enter below.
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#8a9ab0]">
            Cancellation Reason
          </span>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-[#d0daea] bg-[#f8f9fc] px-4 py-3 text-sm text-[#1a2a3a] outline-none transition-all duration-200 focus:border-[#e53e3e] focus:bg-white"
            placeholder="For example: doctor unavailable, emergency, reschedule required, or any other reason"
            disabled={saving}
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-[#d0daea] px-4 py-2.5 text-sm font-medium text-[#4a5a6a] transition-all duration-200 hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep Appointment
          </button>
          <button
            onClick={onCancel}
            disabled={saving || !reason.trim()}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}
          >
            {saving ? 'Cancelling...' : 'Cancel Appointment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
