import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'
import BookingModal from '../components/BookingModal'
import FileUploadModal from '../components/FileUploadModal'
import MedicalRequests from '../components/MedicalRequests'
import { getAllDoctorsWithSlots, searchDoctors } from '../services/doctorService'
import { getAppointments } from '../services/appointmentService'
import { profileService } from '../services/profileService'

const EMOJI_MAP = {
  Cardiologist: '👨‍⚕️', Neurologist: '👩‍⚕️', 'Orthopedic Surgeon': '🧑‍⚕️',
  Endocrinologist: '👩‍⚕️', Dermatologist: '👨‍⚕️', Pulmonologist: '👩‍⚕️',
}

const SPECIALIZATIONS = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Diabetes', 'Dermatology', 'Pulmonology']

const PatientDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast, showToast } = useToast()

  const [tab, setTab] = useState('search')
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [loadingAppts, setLoadingAppts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [uploadBanner, setUploadBanner] = useState(null)
  const profileFilesListRef = useRef(null)

  useEffect(() => {
    loadDoctors()
    loadProfile()
  }, [])

  useEffect(() => {
    if (tab === 'appointments') loadAppointments()
  }, [tab])

  useEffect(() => {
    if (!uploadBanner) return undefined

    const timer = setTimeout(() => {
      setUploadBanner(null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [uploadBanner])

  const loadProfile = async () => {
    try {
      const res = await profileService.getProfile()
      setProfile(res.data?.profile || res.data)
      setProfileMissing(false)
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null)
        setProfileMissing(true)
        return
      }

      // silently fail for non-profile issues
    }
  }

  const handleStartBooking = (doctor) => {
    if (profileMissing) {
      showToast('Please complete your patient profile before booking an appointment', 'warning')
      setTimeout(() => navigate('/patient-profile-setup'), 700)
      return
    }

    setBookingDoctor(doctor)
  }

  const loadDoctors = async () => {
    setLoadingDoctors(true)
    try {
      console.log('🔵 [loadDoctors] Starting...')
      const data = await getAllDoctorsWithSlots()
      console.log('🟢 [loadDoctors] Received data:', data)
      console.log('🟢 [loadDoctors] Data length:', data?.length || 0)
      setDoctors(data)
      console.log('🟢 [loadDoctors] State updated')
    } catch (err) {
      console.error('🔴 [loadDoctors] Error:', err)
      showToast(err.message, 'error')
    } finally {
      setLoadingDoctors(false)
    }
  }

  const loadAppointments = async () => {
    setLoadingAppts(true)
    try {
      const data = await getAppointments()
      setAppointments(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoadingAppts(false)
    }
  }

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q)
    if (!q.trim()) { loadDoctors(); return }
    try {
      const data = await searchDoctors(q)
      setDoctors(data)
    } catch {
      // ignore
    }
  }, [])

  const handleQuickFilter = async (spec) => {
    setActiveFilter(spec)
    setSearchQuery('')
    if (spec === 'All') { loadDoctors(); return }
    try {
      const data = await searchDoctors(spec)
      setDoctors(data)
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleFileUploaded = (fileName) => {
    profileFilesListRef.current?.loadFiles()
    setUploadBanner({
      fileName: fileName || 'Medical file',
      timestamp: Date.now(),
    })
  }

  const displayName = profile?.name 
    ? profile.name 
    : user?.name 
      ? user.name 
      : 'Patient'

  const patientAge = profile?.age ? `${profile.age} years` : '—'
  const patientGender = profile?.gender || '—'
  const patientPhone = profile?.phone || '—'
  const patientBloodGroup = profile?.blood_group || profile?.bloodGroup || '—'

  const upcoming = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed' || a.status === 'upcoming')
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled')

  const navItems = [
    { key: 'search', icon: '🔍', label: 'Find Doctors' },
    { key: 'appointments', icon: '📅', label: 'My Appointments' },
    { key: 'profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
      <Toast toast={toast} />
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBooked={() => showToast(`Appointment booked with ${bookingDoctor.name}!`, 'success')}
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
          <span className="text-sm text-[#4a5a6a]">Hi, {displayName.split(' ')[0]}</span>
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
              👤
            </div>
            <h4 className="text-[15px] font-semibold text-[#1a2a3a]">{displayName}</h4>
            <span className="text-xs text-[#8a9ab0]">Patient</span>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {navItems.map(item => (
              <button key={item.key}
                onClick={() => setTab(item.key)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-left transition-all duration-200"
                style={tab === item.key
                  ? { background: '#e8f0fb', color: '#3a7bd5' }
                  : { color: '#4a5a6a' }}>
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

          {/* SEARCH / FIND DOCTORS TAB */}
          {tab === 'search' && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#1a2a3a]">Find a Specialist</h2>
                <p className="text-sm text-[#8a9ab0] mt-1">Search by disease, symptom, or condition</p>
              </div>

              {profileMissing && (
                <div
                  className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-4"
                  style={{ border: '1px solid #f2d39b', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#1a2a3a]">Complete your patient profile to book appointments</h3>
                    <p className="mt-1 text-sm text-[#8a9ab0]">
                      Add your age, gender, phone number, and blood group once to unlock booking.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/patient-profile-setup')}
                    className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}
                  >
                    Complete Profile
                  </button>
                </div>
              )}

              {/* Search bar */}
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="e.g. Heart Disease, Diabetes, Migraine…"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                  style={{ border: '1.5px solid #d0daea', background: 'white', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}
                  onFocus={e => { e.target.style.borderColor = '#3a7bd5'; e.target.style.boxShadow = '0 4px 24px rgba(58,123,213,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = '#d0daea'; e.target.style.boxShadow = '0 4px 24px rgba(45,90,142,0.08)' }}
                />
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-2 mb-7">
                {SPECIALIZATIONS.map(spec => (
                  <button key={spec}
                    onClick={() => handleQuickFilter(spec)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                    style={activeFilter === spec
                      ? { background: '#3a7bd5', color: 'white' }
                      : { background: 'white', color: '#4a5a6a', border: '1px solid #d0daea' }}>
                    {spec}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1a2a3a]">
                  Available Doctors{' '}
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
                    {doctors.length} found
                  </span>
                </h3>
              </div>

              {loadingDoctors ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-20 text-[#8a9ab0]">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-medium">No doctors found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {doctors.map(doctor => (
                    <DoctorCard
                      key={doctor.doctorId}
                      doctor={doctor}
                      onBook={() => handleStartBooking(doctor)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {tab === 'appointments' && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#1a2a3a]">My Appointments</h2>
                <p className="text-sm text-[#8a9ab0] mt-1">Upcoming and past consultations</p>
              </div>

              {loadingAppts ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-[#4a5a6a] uppercase tracking-wider mb-3">Upcoming</div>
                  {upcoming.length === 0 ? (
                    <div className="text-sm text-[#8a9ab0] mb-8 py-6 text-center bg-white rounded-2xl" style={{ border: '1px solid #e6ecf5' }}>
                      No upcoming appointments
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mb-8">
                      {upcoming.map(apt => (
                        <AppointmentCard key={apt.id || apt._id} apt={apt} />
                      ))}
                    </div>
                  )}

                  <div className="text-xs font-semibold text-[#4a5a6a] uppercase tracking-wider mb-3 mt-6">Past</div>
                  {past.length === 0 ? (
                    <div className="text-sm text-[#8a9ab0] py-6 text-center bg-white rounded-2xl" style={{ border: '1px solid #e6ecf5' }}>
                      No past appointments
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {past.map(apt => (
                        <AppointmentCard key={apt.id || apt._id} apt={apt} past />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#1a2a3a]">My Profile</h2>
                <p className="text-sm text-[#8a9ab0] mt-1">Your account information</p>
              </div>
              {uploadBanner && (
                <div
                  className="mb-6 flex items-center justify-between gap-4 rounded-2xl px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, #e6f9f2, #f2fbf7)',
                    border: '1px solid #a8e6d5',
                    boxShadow: '0 6px 20px rgba(26,158,106,0.08)',
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a7e5a]">File uploaded successfully</p>
                    <p className="text-xs text-[#4a5a6a] truncate">
                      {uploadBanner.fileName} is now available in your medical files.
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1a9e6a]">
                    New
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Profile Details - Left */}
                <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4"
                    style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}>👤</div>
                  <h3 className="text-lg font-semibold text-[#1a2a3a] mb-1">{displayName}</h3>
                  <p className="text-sm text-[#8a9ab0] mb-6">Patient profile details</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['Phone', patientPhone],
                      ['Age', patientAge],
                      ['Gender', patientGender],
                      ['Blood Group', patientBloodGroup]
                    ].map(([label, val]) => (
                      <div key={label} className="py-3 px-3 rounded-lg" style={{ background: '#f8f9fc' }}>
                        <span className="block text-xs font-medium text-[#8a9ab0] uppercase tracking-wide mb-1">{label}</span>
                        <span className="text-sm text-[#1a2a3a] font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Upload - Right */}
                <FileUploadModal 
                  onFileUploaded={handleFileUploaded} 
                />
              </div>

              {/* Uploaded Files Section - Full Width */}
              <ProfileFilesList ref={profileFilesListRef} profile={profile} />

              {/* Medical Requests Section - Full Width */}
              <div className="mt-8">
                <MedicalRequests />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

const DoctorCard = ({ doctor, onBook }) => {
  const emoji = { Cardiologist: '👨‍⚕️', Neurologist: '👩‍⚕️', 'Orthopedic Surgeon': '🧑‍⚕️', Endocrinologist: '👩‍⚕️', Dermatologist: '👨‍⚕️', Pulmonologist: '👩‍⚕️' }[doctor.specialization] || '👨‍⚕️'

  return (
    <div className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#1a2a3a] truncate">{doctor.name}</h4>
          <div className="text-xs text-[#3a7bd5] font-medium">{doctor.specialization}</div>
          <div className="text-xs text-[#8a9ab0]">🏥 {doctor.hospitalName}</div>
        </div>
      </div>

      {doctor.slots && doctor.slots.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-medium text-[#4a5a6a] uppercase tracking-wide mb-2">Available Slots</div>
          <div className="flex flex-wrap gap-1.5">
            {doctor.slots.slice(0, 4).map(slot => (
              <span key={slot.slotId}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
                {slot.time || slot.date}
              </span>
            ))}
            {doctor.slots.length > 4 && (
              <span className="text-[11px] text-[#8a9ab0] py-1">+{doctor.slots.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      <button onClick={onBook}
        className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium text-white transition-all duration-200 hover:-translate-y-px"
        style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 4px 12px rgba(58,123,213,0.2)' }}>
        Book Appointment
      </button>
    </div>
  )
}

const AppointmentCard = ({ apt, past }) => {
  const date = apt.date ? new Date(apt.date) : apt.slot?.date ? new Date(apt.slot.date) : null
  const dateStr = date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'
  const day = date ? date.getDate() : '—'
  const month = date ? date.toLocaleString('en-IN', { month: 'short' }).toUpperCase() : '—'

  const statusColor = {
    confirmed: { bg: '#e8f0fb', color: '#3a7bd5' },
    upcoming: { bg: '#e8f0fb', color: '#3a7bd5' },
    pending: { bg: '#fff8e6', color: '#b07a00' },
    completed: { bg: '#e6f9f2', color: '#1a9e6a' },
    cancelled: { bg: '#fef0f0', color: '#e53e3e' },
  }[apt.status] || { bg: '#e8f0fb', color: '#3a7bd5' }

  const doctorName = apt.doctor?.name || apt.doctorName || 'Doctor'
  const specialization = apt.doctor?.specialization || apt.specialization || ''
  const time = apt.slot?.time || apt.time || '—'
  const isCompleted = apt.status === 'completed'
  const isCancelled = apt.status === 'cancelled'

  const hasConsultationNotes = Boolean(
    apt.reasonForVisit || apt.diagnosis || apt.prescription || apt.additionalNotes
  )

  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4"
      style={{ border: '1px solid #e6ecf5', boxShadow: '0 2px 12px rgba(45,90,142,0.06)', opacity: past ? 0.85 : 1 }}>
      <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: past ? '#e6ecf5' : 'linear-gradient(135deg, #e8f0fb, #dde8f5)' }}>
        <div className="text-lg font-bold" style={{ color: past ? '#8a9ab0' : '#2d5a8e' }}>{day}</div>
        <div className="text-[10px] font-semibold" style={{ color: past ? '#b8c8de' : '#6b8cba' }}>{month}</div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[#1a2a3a] truncate">
          {doctorName}{specialization && ` — ${specialization}`}
        </h4>
        <span className="text-xs text-[#8a9ab0]">{time}</span>
        {(isCompleted || isCancelled) && (
          <div className="mt-3 rounded-xl border border-[#e6ecf5] bg-[#f8f9fc] p-3">
            {isCompleted && hasConsultationNotes && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#3a7bd5]">
                  Consultation Notes
                </div>
                {apt.reasonForVisit && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Reason for Visit</div>
                    <div className="text-sm text-[#1a2a3a]">{apt.reasonForVisit}</div>
                  </div>
                )}
                {apt.diagnosis && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Diagnosis</div>
                    <div className="text-sm text-[#1a2a3a]">{apt.diagnosis}</div>
                  </div>
                )}
                {apt.prescription && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Prescription</div>
                    <div className="text-sm text-[#1a2a3a] whitespace-pre-wrap">{apt.prescription}</div>
                  </div>
                )}
                {apt.additionalNotes && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">Additional Notes</div>
                    <div className="text-sm text-[#1a2a3a] whitespace-pre-wrap">{apt.additionalNotes}</div>
                  </div>
                )}
              </div>
            )}

            {isCancelled && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#e53e3e]">
                  Cancellation Reason
                </div>
                <div className="text-sm text-[#1a2a3a] whitespace-pre-wrap">
                  {apt.cancelReason || 'No cancellation reason provided'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
          style={{ background: statusColor.bg, color: statusColor.color }}>
          {apt.status}
        </span>
      </div>
    </div>
  )
}

export default PatientDashboard

const ProfileFilesList = forwardRef(({ profile }, ref) => {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      console.log('[ProfileFilesList] Starting to load files...')
      const res = await profileService.getUploadedFiles()
      console.log('[ProfileFilesList] API Response:', res)
      console.log('[ProfileFilesList] Response data:', res.data)
      console.log('[ProfileFilesList] Response files:', res.data?.files)
      
      const filesArray = res.data?.files || []
      console.log('[ProfileFilesList] Files array to display:', filesArray)
      
      setUploadedFiles(filesArray)
      console.log('[ProfileFilesList] State updated with files')
    } catch (err) {
      console.error('[ProfileFilesList] Error loading files:', err)
      console.error('[ProfileFilesList] Error response:', err.response?.data)
      console.error('[ProfileFilesList] Error message:', err.message)
      showToast(err.response?.data?.error || 'Failed to load files', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Expose loadFiles method to parent via ref
  useImperativeHandle(ref, () => ({
    loadFiles
  }))

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return

    try {
      await profileService.deleteFile(fileId)
      showToast('File deleted successfully', 'success')
      loadFiles()
    } catch (err) {
      showToast(err.message || 'Failed to delete file', 'error')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#1a2a3a] flex items-center gap-2">
          📋 Your Medical Files
          {uploadedFiles.length > 0 && (
            <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <p className="text-sm text-[#8a9ab0] mt-1">All your uploaded medical documents</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
        </div>
      ) : uploadedFiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-[#8a9ab0] font-medium">No files uploaded yet</p>
          <p className="text-sm text-[#8a9ab0] mt-1">Upload your medical documents using the form above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadedFiles.map(file => (
            <div key={file.id} className="p-4 rounded-xl border border-[#e6ecf5] hover:border-[#3a7bd5] hover:bg-[#f8f9fc] transition-all duration-200"
              style={{ background: '#f8f9fc' }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">📋</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2a3a] truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-xs text-[#8a9ab0] mt-1">
                    {new Date(file.uploaded_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-[#3a7bd5] font-medium mt-1">Medical Report</p>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-[#8a9ab0] hover:text-red-500 transition-colors flex-shrink-0 p-1"
                  title="Delete file"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

ProfileFilesList.displayName = 'ProfileFilesList'
