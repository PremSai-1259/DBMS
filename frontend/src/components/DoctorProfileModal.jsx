import { useState, useEffect } from 'react'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return '—'
  const date = new Date(`${dateValue}T${timeValue}`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const DoctorProfileModal = ({ doctorId, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState(null)
  const [appointmentHistory, setAppointmentHistory] = useState([])
  const { showToast } = useToast()

  useEffect(() => {
    if (doctorId) {
      loadDoctorProfile()
    }
  }, [doctorId])

  const loadDoctorProfile = async () => {
    setLoading(true)
    try {
      const res = await profileService.getDoctorProfileWithHistory(doctorId)
      setDoctor(res.data.doctor)
      setAppointmentHistory(res.data.appointmentHistory || [])
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to load doctor profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!doctor && !loading) {
    return null
  }

  const upcoming = appointmentHistory.filter(a => {
    const date = new Date(a.slotDate)
    return date > new Date() && ['confirmed', 'pending'].includes(a.status)
  })

  const past = appointmentHistory.filter(a => {
    const date = new Date(a.slotDate)
    return date <= new Date() || a.status === 'completed' || a.status === 'cancelled'
  })

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 40, 80, 0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl max-h-[90vh] overflow-y-auto max-w-2xl w-full"
        style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-6 border-b"
          style={{ borderColor: '#e6ecf5', background: 'linear-gradient(135deg, #f8faff 0%, #eff4fb 100%)' }}
        >
          <h2 className="text-xl font-semibold text-[#1a2a3a]">Doctor Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl hover:bg-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
            </div>
          ) : doctor ? (
            <>
              {/* Doctor Info */}
              <div className="mb-8">
                <div className="flex items-start gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid #e6ecf5' }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #e8f0fb, #e6ecf5)' }}
                  >
                    👨‍⚕️
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#1a2a3a]">Dr. {doctor.name}</h3>
                    <p className="text-[#3a7bd5] font-medium">{doctor.specialization}</p>
                    <p className="text-sm text-[#8a9ab0] mt-1">{doctor.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    ['Experience', `${doctor.experience || '—'} years`],
                    ['Hospital', doctor.hospitalName || '—'],
                    ['Address', doctor.address || '—'],
                    ['Verification', doctor.isVerified ? '✓ Verified' : 'Pending'],
                  ].map(([label, val]) => (
                    <div key={label} className="py-3 px-3 rounded-lg" style={{ background: '#f8f9fc' }}>
                      <span className="block text-xs font-medium text-[#8a9ab0] uppercase tracking-wide mb-1">{label}</span>
                      <span className="text-sm text-[#1a2a3a] font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointment History */}
              <div>
                <h4 className="text-lg font-semibold text-[#1a2a3a] mb-4">Appointment History</h4>

                {appointmentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-[#8a9ab0]">No appointments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming */}
                    {upcoming.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-[#4a5a6a] uppercase tracking-wider mb-2">Upcoming</div>
                        <div className="space-y-2">
                          {upcoming.map(apt => (
                            <div
                              key={apt.id}
                              className="p-3 rounded-lg"
                              style={{ background: '#e8f0fb', border: '1px solid #c9dff0' }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-[#1a2a3a]">
                                    {formatDate(apt.slotDate)} at {formatTime(apt.slotDate, apt.slotStartTime)}
                                  </p>
                                  <p className="text-xs text-[#8a9ab0]">Slot #{apt.slotNumber}</p>
                                </div>
                                <span
                                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                                  style={{ background: 'white', color: '#3a7bd5' }}
                                >
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past */}
                    {past.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-[#4a5a6a] uppercase tracking-wider mb-2 mt-4">Past Appointments</div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {past.map(apt => (
                            <div
                              key={apt.id}
                              className="p-3 rounded-lg opacity-75"
                              style={{ background: '#e6ecf5', border: '1px solid #d0daea' }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-[#1a2a3a]">
                                    {formatDate(apt.slotDate)} at {formatTime(apt.slotDate, apt.slotStartTime)}
                                  </p>
                                  <p className="text-xs text-[#8a9ab0]">Slot #{apt.slotNumber}</p>
                                </div>
                                <span
                                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                                  style={{
                                    background:
                                      apt.status === 'completed'
                                        ? '#e6f9f2'
                                        : apt.status === 'cancelled'
                                          ? '#fef0f0'
                                          : 'white',
                                    color:
                                      apt.status === 'completed'
                                        ? '#1a9e6a'
                                        : apt.status === 'cancelled'
                                          ? '#e53e3e'
                                          : '#8a9ab0',
                                  }}
                                >
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#8a9ab0]">Unable to load doctor profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorProfileModal
