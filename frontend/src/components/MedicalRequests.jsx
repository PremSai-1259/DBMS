import { useState, useEffect } from 'react'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'
import DoctorProfileModal from './DoctorProfileModal'

const MedicalRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState(null)
  const [respondingRequestId, setRespondingRequestId] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await profileService.getMedicalRequests()
      setRequests(res.data.requests || [])
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Separate pending and approved requests
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')

  // Group approved requests by doctor
  const doctorsWithAccess = approvedRequests.reduce((acc, req) => {
    const existing = acc.find(d => d.doctorId === req.doctorId)
    if (existing) {
      existing.files.push({
        id: req.id,
        fileName: req.fileName,
        expiresAt: req.expiresAt
      })
    } else {
      acc.push({
        doctorId: req.doctorId,
        doctorName: req.doctorName,
        files: [{
          id: req.id,
          fileName: req.fileName,
          expiresAt: req.expiresAt
        }]
      })
    }
    return acc
  }, [])

  const handleApprove = async (requestId) => {
    setRespondingRequestId(requestId)
    try {
      await profileService.respondToMedicalRequest(requestId, 'approved')
      showToast('Request approved', 'success')
      loadRequests()
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to approve request', 'error')
    } finally {
      setRespondingRequestId(null)
    }
  }

  const handleReject = async (requestId) => {
    setRespondingRequestId(requestId)
    try {
      await profileService.respondToMedicalRequest(requestId, 'rejected')
      showToast('Request rejected', 'success')
      loadRequests()
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to reject request', 'error')
    } finally {
      setRespondingRequestId(null)
    }
  }

  const handleRevoke = async (requestId) => {
    if (window.confirm('Are you sure you want to revoke access for this doctor?')) {
      setRespondingRequestId(requestId)
      try {
        await profileService.revokeMedicalAccess(requestId)
        showToast('Access revoked successfully', 'success')
        loadRequests()
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to revoke access', 'error')
      } finally {
        setRespondingRequestId(null)
      }
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <>
      {selectedDoctorId && (
        <DoctorProfileModal
          doctorId={selectedDoctorId}
          onClose={() => setSelectedDoctorId(null)}
        />
      )}

      <div className="space-y-6">
        {/* PENDING REQUESTS SECTION */}
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1a2a3a] flex items-center gap-2">
              📋 Medical Report Requests
              {pendingRequests.length > 0 && (
                <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#fff4e6', color: '#b07a00' }}>
                  {pendingRequests.length} pending
                </span>
              )}
            </h3>
            <p className="text-sm text-[#8a9ab0] mt-1">Manage pending requests from doctors for your medical records</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-[#8a9ab0] font-medium">No pending requests</p>
              <p className="text-sm text-[#8a9ab0] mt-1">You'll see new requests here when doctors request access to your medical records</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#e6ecf5] hover:border-[#3a7bd5] transition-all duration-200"
                  style={{ background: '#f8f9fc' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-[#1a2a3a]">Dr. {req.doctorName}</h4>
                      <button
                        onClick={() => setSelectedDoctorId(req.doctorId)}
                        className="text-xs px-2 py-1 rounded text-[#3a7bd5] hover:bg-white transition-colors"
                        style={{ border: '1px solid #c9dff0' }}
                      >
                        View Profile
                      </button>
                    </div>
                    <p className="text-xs text-[#8a9ab0]">
                      📄 {req.fileName} • Requested {formatDate(req.requestedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={respondingRequestId === req.id}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #1a9e6a, #158a5a)' }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={respondingRequestId === req.id}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DOCTORS WITH ACCESS SECTION */}
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1a2a3a] flex items-center gap-2">
              🔐 Doctors with Access
              {doctorsWithAccess.length > 0 && (
                <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#e6f9f2', color: '#1a9e6a' }}>
                  {doctorsWithAccess.length} doctor{doctorsWithAccess.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-sm text-[#8a9ab0] mt-1">Medical reports you've granted access to</p>
          </div>

          {doctorsWithAccess.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🚫</div>
              <p className="text-[#8a9ab0] font-medium">No approved access yet</p>
              <p className="text-sm text-[#8a9ab0] mt-1">Doctors will appear here once you approve their requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doctorsWithAccess.map(doctor => (
                <div
                  key={doctor.doctorId}
                  className="p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md"
                  style={{ background: '#f0f9f6', borderLeft: '4px solid #1a9e6a', border: '1px solid #a8e6d5' }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-[#1a2a3a]">Dr. {doctor.doctorName}</h4>
                        <button
                          onClick={() => setSelectedDoctorId(doctor.doctorId)}
                          className="text-xs px-2 py-1 rounded text-[#1a9e6a] hover:bg-white transition-colors"
                          style={{ border: '1px solid #a8e6d5' }}
                        >
                          View Profile
                        </button>
                      </div>
                      <div className="space-y-1">
                        {doctor.files.map(file => (
                          <div key={file.id} className="text-xs text-[#1a7e5a]">
                            <div className="flex items-center justify-between">
                              <span>📄 {file.fileName}</span>
                              {file.expiresAt && (
                                <span className="text-[#8a9ab0]">Expires {formatDate(file.expiresAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const requestIds = doctor.files.map(f => f.id)
                        requestIds.forEach(id => handleRevoke(id))
                      }}
                      disabled={respondingRequestId !== null}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-[#1a7e5a] transition-all duration-200 hover:bg-white flex-shrink-0 disabled:opacity-50"
                      style={{ border: '1px solid #a8e6d5' }}
                    >
                      Revoke All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MedicalRequests
