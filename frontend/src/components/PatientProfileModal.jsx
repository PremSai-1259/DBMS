import { useEffect, useState } from 'react'
import Toast from './Toast'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'

const formatDate = (value, options = {}) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
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

const formatTimeRange = (dateValue, startTime, endTime) => {
  const start = formatTime(dateValue, startTime)
  const end = formatTime(dateValue, endTime)

  if (start === '—' || end === '—') return start
  return `${start} - ${end}`
}

const PatientProfileModal = ({ patientId, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [requestingFileId, setRequestingFileId] = useState(null)
  const { toast, showToast } = useToast()

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      try {
        const res = await profileService.getDoctorPatientSummary(patientId)
        setSummary(res.data)
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to load patient profile', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      loadSummary()
    }
  }, [patientId, showToast])

  const refreshSummary = async () => {
    const res = await profileService.getDoctorPatientSummary(patientId)
    setSummary(res.data)
  }

  const handleRequestAccess = async (fileId) => {
    setRequestingFileId(fileId)
    try {
      await profileService.requestMedicalReportAccess(patientId, fileId)
      showToast('Access request sent to patient', 'success')
      await refreshSummary()
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to request access', 'error')
    } finally {
      setRequestingFileId(null)
    }
  }

  const patient = summary?.patient
  const appointmentHistory = summary?.appointmentHistory || []
  const documents = summary?.documents || []

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 40, 80, 0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Toast toast={toast} />

      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white"
        style={{ boxShadow: '0 30px 80px rgba(20, 40, 80, 0.24)' }}
      >
        <div className="flex items-center justify-between border-b border-[#e6ecf5] px-8 py-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#1a2a3a]">Patient Profile</h2>
            <p className="mt-1 text-sm text-[#8a9ab0]">Review appointments, uploaded reports, and access status.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#4a5a6a] transition-all duration-200 hover:bg-[#f8f9fc]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
            </div>
          ) : !patient ? (
            <div className="rounded-2xl border border-[#e6ecf5] bg-[#f8f9fc] p-8 text-center text-sm text-[#8a9ab0]">
              Patient profile could not be loaded.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-[#e6ecf5] bg-[#f8fbff] p-6">
                  <div className="mb-5 flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
                      style={{ background: 'linear-gradient(135deg, #e8f0fb, #dfe9f7)' }}
                    >
                      👤
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-[#1a2a3a]">{patient.name}</h3>
                      <p className="truncate text-sm text-[#8a9ab0]">{patient.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Phone', patient.phone || '—'],
                      ['Age', patient.age ? `${patient.age} years` : '—'],
                      ['Gender', patient.gender || '—'],
                      ['Blood Group', patient.bloodGroup || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-white px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a9ab0]">{label}</div>
                        <div className="mt-1 text-sm font-medium text-[#1a2a3a]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e6ecf5] bg-white p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4a5a6a]">Quick Summary</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ['Appointments With You', appointmentHistory.length],
                      ['Uploaded Reports', documents.length],
                      ['Approved Reports', documents.filter((doc) => doc.accessStatus === 'approved').length],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl bg-[#f8f9fc] px-4 py-3">
                        <span className="text-sm text-[#4a5a6a]">{label}</span>
                        <span className="text-base font-semibold text-[#2d5a8e]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e6ecf5] bg-white p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">Appointment History With You</h3>
                  <span className="rounded-full bg-[#e8f0fb] px-3 py-1 text-xs font-medium text-[#3a7bd5]">
                    {appointmentHistory.length} total
                  </span>
                </div>

                {appointmentHistory.length === 0 ? (
                  <p className="text-sm text-[#8a9ab0]">No shared appointment history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {appointmentHistory.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-3 rounded-xl border border-[#e6ecf5] bg-[#fafcff] px-4 py-4 md:flex-row md:items-center"
                      >
                        <div className="min-w-[220px] rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#2d5a8e]">
                          {formatDate(appointment.slotDate)} · {formatTimeRange(appointment.slotDate, appointment.slotStartTime, appointment.slotEndTime)}
                        </div>
                        <div className="flex-1 text-sm text-[#4a5a6a]">
                          Slot #{appointment.slotNumber}
                          {appointment.cancelReason ? ` · ${appointment.cancelReason}` : ''}
                        </div>
                        <span
                          className="w-fit rounded-full px-3 py-1 text-xs font-medium capitalize"
                          style={
                            appointment.status === 'confirmed'
                              ? { background: '#e6f9f2', color: '#1a9e6a' }
                              : appointment.status === 'cancelled'
                              ? { background: '#fef0f0', color: '#e53e3e' }
                              : { background: '#fff8e6', color: '#b07a00' }
                          }
                        >
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#e6ecf5] bg-white p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">Uploaded Medical Reports</h3>
                  <span className="rounded-full bg-[#f4fbf7] px-3 py-1 text-xs font-medium text-[#1a9e6a]">
                    {documents.length} reports
                  </span>
                </div>

                {documents.length === 0 ? (
                  <p className="text-sm text-[#8a9ab0]">This patient has not uploaded any medical reports yet.</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => {
                      const isPending = document.accessStatus === 'pending'

                      return (
                        <div
                          key={document.id}
                          className="flex flex-col gap-3 rounded-xl border border-[#e6ecf5] bg-[#fafcff] px-4 py-4 lg:flex-row lg:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[#1a2a3a]">{document.fileName}</div>
                            <div className="mt-1 text-xs text-[#8a9ab0]">
                              Uploaded on {formatDate(document.uploadedAt)} · {document.accessStatus ? `Access ${document.accessStatus}` : 'No access requested yet'}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {!document.accessStatus || document.accessStatus !== 'approved' ? (
                              <button
                                onClick={() => handleRequestAccess(document.id)}
                                disabled={isPending || requestingFileId === document.id}
                                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                                style={
                                  isPending
                                    ? { background: '#fff8e6', color: '#b07a00' }
                                    : { background: '#e8f0fb', color: '#3a7bd5' }
                                }
                              >
                                {requestingFileId === document.id
                                  ? 'Requesting...'
                                  : isPending
                                  ? 'Request Pending'
                                  : 'Request Access'}
                              </button>
                            ) : null}

                            <span
                              className="rounded-full px-3 py-1 text-xs font-medium capitalize"
                              style={
                                document.accessStatus === 'approved'
                                  ? { background: '#e6f9f2', color: '#1a9e6a' }
                                  : document.accessStatus === 'pending'
                                  ? { background: '#fff8e6', color: '#b07a00' }
                                  : document.accessStatus === 'rejected'
                                  ? { background: '#fef0f0', color: '#e53e3e' }
                                  : { background: '#f5f5f5', color: '#6b8cba' }
                              }
                            >
                              {document.accessStatus || 'not requested'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientProfileModal
