import { useState, useEffect } from 'react'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'
import { profileService } from '../services/profileService'
import Navigation from '../components/Navigation'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { toast, showToast } = useToast()

  const [pendingDoctors, setPendingDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchPendingDoctors()
  }, [])

  const fetchPendingDoctors = async () => {
    setLoading(true)
    try {
      const res = await profileService.getPendingDoctorApprovals()
      setPendingDoctors(res.data.pending || [])
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load pending approvals', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCertificate = (doctor) => {
    setSelectedDoctor(doctor)
  }

  const handleCloseCertificate = () => {
    setSelectedDoctor(null)
  }

  const handleApprove = async (approvalId) => {
    if (!window.confirm('Approve this doctor profile?')) return

    setProcessingId(approvalId)
    try {
      await profileService.approveDoctorRequest(approvalId)
      showToast('Doctor approved successfully', 'success')
      setPendingDoctors(pendingDoctors.filter(d => d.approvalId !== approvalId))
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve doctor', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (doctor) => {
    setSelectedDoctor(doctor)
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a rejection reason', 'error')
      return
    }

    if (rejectReason.trim().length < 10) {
      showToast('Rejection reason must be at least 10 characters', 'error')
      return
    }

    setProcessingId(selectedDoctor.approvalId)
    try {
      await profileService.rejectDoctorRequest(selectedDoctor.approvalId, rejectReason)
      showToast('Doctor request rejected', 'success')
      setPendingDoctors(pendingDoctors.filter(d => d.approvalId !== selectedDoctor.approvalId))
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedDoctor(null)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject doctor', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const downloadCertificate = async (fileId, fileName) => {
    try {
      const link = document.createElement('a')
      link.href = `http://localhost:5000/api/files/${fileId}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      showToast('Failed to download certificate', 'error')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
      <Toast toast={toast} />
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a2a3a] mb-2">Doctor Approval Requests</h1>
          <p className="text-[#8a9ab0]">Review and manage pending doctor profile approvals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)' }}>
            <div className="text-3xl font-bold">{pendingDoctors.length}</div>
            <div className="text-sm opacity-90">Pending Approvals</div>
          </div>
          <div className="rounded-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="text-3xl font-bold">📋</div>
            <div className="text-sm opacity-90">Awaiting Review</div>
          </div>
          <div className="rounded-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="text-3xl font-bold">✓</div>
            <div className="text-sm opacity-90">Action Required</div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block text-4xl mb-4">⏳</div>
            <p className="text-[#8a9ab0]">Loading pending approvals...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && pendingDoctors.length === 0 && (
          <div className="text-center py-12 rounded-lg" style={{ background: 'white', boxShadow: '0 2px 8px rgba(45,90,142,0.08)' }}>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-[#8a9ab0] text-lg mb-2">No Pending Requests</p>
            <p className="text-[#c0c8d8]">All doctor profiles have been reviewed!</p>
          </div>
        )}

        {/* Requests List */}
        {!loading && pendingDoctors.length > 0 && (
          <div className="space-y-4">
            {pendingDoctors.map((doctor) => (
              <div
                key={doctor.approvalId}
                className="rounded-lg overflow-hidden border border-[#e0e8f0]"
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(45,90,142,0.08)' }}
              >
                <div className="p-6">
                  {/* Doctor Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1a2a3a] mb-1">{doctor.doctor.name}</h3>
                      <p className="text-sm text-[#8a9ab0] mb-3">{doctor.doctor.email}</p>
                      
                      {/* Doctor Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-[#4a5a6a] mb-1">Specialization</p>
                          <p className="text-sm text-[#3a7bd5] font-semibold">{doctor.doctor.specialization}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#4a5a6a] mb-1">Experience</p>
                          <p className="text-sm text-[#3a7bd5] font-semibold">{doctor.doctor.experience} years</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#4a5a6a] mb-1">Hospital/Clinic</p>
                          <p className="text-sm text-[#3a7bd5]">{doctor.doctor.hospitalName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#4a5a6a] mb-1">Request Date</p>
                          <p className="text-sm text-[#3a7bd5]">
                            {new Date(doctor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-medium text-[#4a5a6a] mb-1">Address</p>
                        <p className="text-sm text-[#6a7a8a]">{doctor.doctor.address}</p>
                      </div>
                    </div>

                    {/* Certificate Section */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-4xl mb-2">📄</div>
                      <button
                        onClick={() => handleViewCertificate(doctor)}
                        className="text-sm font-medium text-[#3a7bd5] hover:text-[#2d5a8e] transition-colors mb-2 block w-full text-center"
                      >
                        View Certificate
                      </button>
                      <button
                        onClick={() => downloadCertificate(doctor.certificateFileId, `certificate-${doctor.doctor.id}.pdf`)}
                        className="text-xs font-medium text-[#8a9ab0] hover:text-[#3a7bd5] transition-colors block w-full text-center"
                      >
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-[#e0e8f0]">
                    <button
                      onClick={() => handleApprove(doctor.approvalId)}
                      disabled={processingId === doctor.approvalId}
                      className="flex-1 py-2 rounded-lg font-medium text-white transition-all duration-200"
                      style={{
                        background: processingId === doctor.approvalId ? '#a8c5e0' : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                        cursor: processingId === doctor.approvalId ? 'not-allowed' : 'pointer',
                        opacity: processingId === doctor.approvalId ? 0.7 : 1
                      }}
                    >
                      {processingId === doctor.approvalId ? '⏳ Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectClick(doctor)}
                      disabled={processingId === doctor.approvalId}
                      className="flex-1 py-2 rounded-lg font-medium text-white transition-all duration-200"
                      style={{
                        background: processingId === doctor.approvalId ? '#f5a8a8' : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                        cursor: processingId === doctor.approvalId ? 'not-allowed' : 'pointer',
                        opacity: processingId === doctor.approvalId ? 0.7 : 1
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Viewer Modal */}
      {selectedDoctor && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            {/* Modal Header */}
            <div className="sticky top-0 p-6 border-b border-[#e0e8f0]" style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {selectedDoctor.doctor.name} - Certificate
                </h3>
                <button
                  onClick={handleCloseCertificate}
                  className="text-2xl leading-none text-white hover:opacity-70 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Doctor Info Summary */}
              <div className="mb-6 p-4 rounded-lg" style={{ background: '#f8f9fc' }}>
                <h4 className="font-semibold text-[#1a2a3a] mb-3">Doctor Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#8a9ab0] mb-1">Name</p>
                    <p className="text-[#1a2a3a] font-medium">{selectedDoctor.doctor.name}</p>
                  </div>
                  <div>
                    <p className="text-[#8a9ab0] mb-1">Email</p>
                    <p className="text-[#1a2a3a] font-medium">{selectedDoctor.doctor.email}</p>
                  </div>
                  <div>
                    <p className="text-[#8a9ab0] mb-1">Specialization</p>
                    <p className="text-[#1a2a3a] font-medium">{selectedDoctor.doctor.specialization}</p>
                  </div>
                  <div>
                    <p className="text-[#8a9ab0] mb-1">Experience</p>
                    <p className="text-[#1a2a3a] font-medium">{selectedDoctor.doctor.experience} years</p>
                  </div>
                </div>
              </div>

              {/* Certificate Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#1a2a3a] mb-3">Uploaded Certificate</h4>
                <div className="p-4 rounded-lg border-2 border-dashed border-[#3a7bd5]" style={{ background: '#f0f4fa' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-sm font-medium text-[#3a7bd5] mb-3">Certificate File</p>
                    <button
                      onClick={() => downloadCertificate(selectedDoctor.certificateFileId, `certificate-${selectedDoctor.doctor.id}.pdf`)}
                      className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)' }}
                    >
                      ⬇️ Download Certificate
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#e0e8f0]">
                <button
                  onClick={() => {
                    handleCloseCertificate()
                  }}
                  className="flex-1 py-2 rounded-lg font-medium text-[#3a7bd5] border border-[#3a7bd5] hover:bg-blue-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-md w-full" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e0e8f0]" style={{ background: 'linear-gradient(160deg, #f5576c, #f093fb)' }}>
              <h3 className="text-lg font-semibold text-white">Reject Application</h3>
              <p className="text-white/80 text-sm mt-1">
                for {selectedDoctor?.doctor?.name}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-[#8a9ab0] mb-4">
                Please provide a reason for rejecting this doctor's profile. This will be sent to the doctor.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (minimum 10 characters)..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-[#d0daea] focus:border-[#f5576c] focus:outline-none focus:ring-4 focus:ring-[#f5576c]/20 transition-all resize-none"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />

              <div className="text-xs text-[#8a9ab0] mt-2">
                Characters: {rejectReason.length} (minimum 10)
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#e0e8f0] flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="flex-1 py-2 rounded-lg font-medium text-[#8a9ab0] border border-[#e0e8f0] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processingId !== null || rejectReason.trim().length < 10}
                className="flex-1 py-2 rounded-lg font-medium text-white transition-all duration-200"
                style={{
                  background: rejectReason.trim().length < 10 ? '#a8c5e0' : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                  cursor: rejectReason.trim().length < 10 || processingId !== null ? 'not-allowed' : 'pointer'
                }}
              >
                {processingId !== null ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
