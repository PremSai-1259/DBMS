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
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
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

  const handleViewCertificate = async (doctor) => {
    setSelectedDoctor(doctor)
    setLoadingDetails(true)
    try {
      const res = await profileService.getDoctorApprovalDetails(doctor.doctorId)
      setSelectedDoctorDetails(res.data)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load doctor details', 'error')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCloseCertificate = () => {
    setSelectedDoctor(null)
    setSelectedDoctorDetails(null)
  }

  const handleApprove = async (approvalId) => {
    if (!window.confirm('Approve this doctor profile?')) return

    setProcessingId(approvalId)
    try {
      await profileService.approveDoctorRequest(approvalId)
      showToast('Doctor approved successfully', 'success')
      // Refresh pending list to get latest data
      await fetchPendingDoctors()
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to approve doctor'
      showToast(errorMsg, 'error')
      // Refresh list in case approval was already processed
      await fetchPendingDoctors()
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
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedDoctor(null)
      // Refresh pending list to get latest data
      await fetchPendingDoctors()
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject doctor'
      showToast(errorMsg, 'error')
      // Refresh list in case rejection was already processed
      await fetchPendingDoctors()
    } finally {
      setProcessingId(null)
    }
  }

  const downloadCertificate = async (fileId, fileName) => {
    try {
      // Use profileService with auth headers instead of direct link
      await profileService.downloadFile(fileId, fileName)
      showToast('Certificate downloaded successfully', 'success')
    } catch (err) {
      console.error('Download error:', err)
      const errorMsg = err.response?.status === 401 
        ? 'Authentication failed - please login again'
        : err.response?.status === 404
        ? 'File not found'
        : err.message?.includes('timeout')
        ? 'Download timeout - file too large'
        : 'Failed to download certificate'
      showToast(errorMsg, 'error')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
      <Toast toast={toast} />
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a2a3a] mb-2">Doctor Approval Requests</h1>
            <p className="text-[#8a9ab0]">Review and manage pending doctor profile approvals</p>
          </div>
          <button
            onClick={fetchPendingDoctors}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200"
            style={{
              background: loading ? '#a8c5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            title="Refresh pending approvals list"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80 font-medium mb-1">Pending Reviews</p>
                <div className="text-4xl font-bold">{pendingDoctors.filter(d => d.status === 'pending').length}</div>
              </div>
              <div className="text-4xl opacity-30">⏳</div>
            </div>
          </div>
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80 font-medium mb-1">Approved Doctors</p>
                <div className="text-4xl font-bold">{pendingDoctors.filter(d => d.status === 'approved').length}</div>
              </div>
              <div className="text-4xl opacity-30">✓</div>
            </div>
          </div>
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80 font-medium mb-1">Rejected Requests</p>
                <div className="text-4xl font-bold">{pendingDoctors.filter(d => d.status === 'rejected').length}</div>
              </div>
              <div className="text-4xl opacity-30">✕</div>
            </div>
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
                className="rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-lg"
                style={{ 
                  borderColor: doctor.status === 'pending' ? '#3a7bd5' : (doctor.status === 'approved' ? '#4ade80' : '#f5576c'),
                  background: 'white',
                  boxShadow: '0 2px 12px rgba(45,90,142,0.08)'
                }}
              >
                <div className="p-6">
                  {/* Doctor Header with Status Badge */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#1a2a3a]">{doctor.doctor.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap`}
                          style={{
                            background: doctor.status === 'pending' ? '#e6f2ff' : (doctor.status === 'approved' ? '#dcfce7' : '#fee2e2'),
                            color: doctor.status === 'pending' ? '#3a7bd5' : (doctor.status === 'approved' ? '#15803d' : '#b91c1c')
                          }}>
                          {doctor.status === 'pending' ? '⏳ Pending' : (doctor.status === 'approved' ? '✓ Approved' : '✕ Rejected')}
                        </span>
                      </div>
                      <p className="text-sm text-[#8a9ab0] mb-4">📧 {doctor.doctor.email}</p>
                      
                      {/* Doctor Details Grid - Improved */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 rounded-lg" style={{ background: '#f8f9fc', border: '1px solid #e0e8f0' }}>
                        <div>
                          <p className="text-xs font-semibold text-[#4a5a6a] mb-1 uppercase tracking-wider">Specialization</p>
                          <p className="text-sm font-bold text-[#3a7bd5]">{doctor.doctor.specialization || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#4a5a6a] mb-1 uppercase tracking-wider">Experience</p>
                          <p className="text-sm font-bold text-[#3a7bd5]">{doctor.doctor.experience || 0} yrs</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-semibold text-[#4a5a6a] mb-1 uppercase tracking-wider">Hospital/Clinic</p>
                          <p className="text-sm font-bold text-[#3a7bd5]">{doctor.doctor.hospitalName || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-semibold text-[#4a5a6a] mb-1 uppercase tracking-wider">Address</p>
                          <p className="text-sm font-bold text-[#3a7bd5]">{doctor.doctor.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#4a5a6a] mb-1 uppercase tracking-wider">Submitted</p>
                          <p className="text-sm font-bold text-[#3a7bd5]">{new Date(doctor.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Section */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-4xl mb-3">📄</div>
                      <button
                        onClick={() => handleViewCertificate(doctor)}
                        className="text-xs font-bold px-4 py-2 rounded-lg text-white transition-all duration-200 mb-2 block whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)' }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => downloadCertificate(doctor.certificateFileId, `certificate-${doctor.doctor.id}.pdf`)}
                        className="text-xs font-medium text-[#3a7bd5] hover:text-[#2d5a8e] transition-colors block"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-[#e0e8f0] pt-4 mt-4">
                    {doctor.status === 'pending' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(doctor.approvalId)}
                          disabled={processingId === doctor.approvalId}
                          className="flex-1 py-3 rounded-lg font-bold text-white transition-all duration-200 transform hover:scale-105"
                          style={{
                            background: processingId === doctor.approvalId ? '#a8c5e0' : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                            cursor: processingId === doctor.approvalId ? 'not-allowed' : 'pointer',
                            opacity: processingId === doctor.approvalId ? 0.7 : 1
                          }}
                        >
                          {processingId === doctor.approvalId ? '⏳ Processing...' : '✓ Approve Doctor'}
                        </button>
                        <button
                          onClick={() => handleRejectClick(doctor)}
                          disabled={processingId === doctor.approvalId}
                          className="flex-1 py-3 rounded-lg font-bold text-white transition-all duration-200 transform hover:scale-105"
                          style={{
                            background: processingId === doctor.approvalId ? '#f5a8a8' : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                            cursor: processingId === doctor.approvalId ? 'not-allowed' : 'pointer',
                            opacity: processingId === doctor.approvalId ? 0.7 : 1
                          }}
                        >
                          ✕ Reject Request
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 rounded-lg font-bold"
                        style={{
                          background: doctor.status === 'approved' ? '#dcfce7' : '#fee2e2',
                          color: doctor.status === 'approved' ? '#15803d' : '#b91c1c'
                        }}>
                        {doctor.status === 'approved' ? '✓ Already Approved' : '✕ Already Rejected'}
                      </div>
                    )}
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            {/* Modal Header */}
            <div className="sticky top-0 p-6 border-b border-[#e0e8f0]" style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {selectedDoctor.doctor.name} - Complete Profile & Documents
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
              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="inline-block text-4xl mb-4">⏳</div>
                  <p className="text-[#8a9ab0]">Loading doctor details...</p>
                </div>
              ) : selectedDoctorDetails ? (
                <>
                  {/* Doctor Info Summary */}
                  <div className="mb-6 p-6 rounded-lg" style={{ background: '#f8f9fc', border: '1px solid #e0e8f0' }}>
                    <h4 className="font-semibold text-[#1a2a3a] mb-4 text-lg">👤 Doctor Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[#8a9ab0] mb-1 font-medium">Name</p>
                        <p className="text-[#1a2a3a] font-semibold">{selectedDoctorDetails.doctor.name}</p>
                      </div>
                      <div>
                        <p className="text-[#8a9ab0] mb-1 font-medium">Email</p>
                        <p className="text-[#1a2a3a] font-semibold">{selectedDoctorDetails.doctor.email}</p>
                      </div>
                      <div>
                        <p className="text-[#8a9ab0] mb-1 font-medium">Specialization</p>
                        <p className="text-[#1a2a3a] font-semibold">{selectedDoctorDetails.doctor.specialization}</p>
                      </div>
                      <div>
                        <p className="text-[#8a9ab0] mb-1 font-medium">Experience</p>
                        <p className="text-[#1a2a3a] font-semibold">{selectedDoctorDetails.doctor.experience} years</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[#8a9ab0] mb-1 font-medium">Hospital/Clinic</p>
                        <p className="text-[#1a2a3a] font-semibold">{selectedDoctorDetails.doctor.hospitalName}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[#8a9ab0] mb-1 font-medium">Address</p>
                        <p className="text-[#1a2a3a] font-semibold">{selectedDoctorDetails.doctor.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate File Section */}
                  {selectedDoctorDetails.certificateFile && (
                    <div className="mb-6 p-6 rounded-lg border-2 border-dashed border-[#3a7bd5]" style={{ background: '#f0f4fa' }}>
                      <h4 className="font-semibold text-[#1a2a3a] mb-4">📋 Primary Certificate</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1a2a3a]">{selectedDoctorDetails.certificateFile.name}</p>
                          <p className="text-xs text-[#8a9ab0] mt-1">ID: {selectedDoctorDetails.certificateFile.id}</p>
                        </div>
                        <button
                          onClick={() => downloadCertificate(selectedDoctorDetails.certificateFile.id, selectedDoctorDetails.certificateFile.name)}
                          className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200"
                          style={{ background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)' }}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* All Uploaded Files Section */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-[#1a2a3a] mb-4">📁 All Uploaded Files ({selectedDoctorDetails.allFiles?.length || 0})</h4>
                    {selectedDoctorDetails.allFiles && selectedDoctorDetails.allFiles.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDoctorDetails.allFiles.map((file, index) => (
                          <div
                            key={file.id}
                            className="p-4 rounded-lg border border-[#e0e8f0] flex items-center justify-between"
                            style={{ background: index % 2 === 0 ? '#fafbfc' : 'white' }}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-[#1a2a3a]">{index + 1}. {file.name}</p>
                              <div className="flex gap-4 mt-2 text-xs text-[#8a9ab0]">
                                <span>📂 Type: <strong>{file.type}</strong></span>
                                <span>📅 Uploaded: <strong>{new Date(file.uploadedAt).toLocaleDateString()}</strong></span>
                                <span>🔐 Hash: <strong>{file.hashValue?.substring(0, 16)}...</strong></span>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadCertificate(file.id, file.name)}
                              className="ml-4 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                              ⬇️
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg text-center" style={{ background: '#f8f9fc' }}>
                        <p className="text-[#8a9ab0]">No additional files uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Approval Status */}
                  <div className="mb-6 p-4 rounded-lg" style={{ background: '#f8f9fc', border: '1px solid #e0e8f0' }}>
                    <h4 className="font-semibold text-[#1a2a3a] mb-3">ℹ️ Approval Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#8a9ab0] mb-1">Status</p>
                        <p className="text-[#1a2a3a] font-semibold capitalize">{selectedDoctorDetails.approval.status}</p>
                      </div>
                      <div>
                        <p className="text-[#8a9ab0] mb-1">Submitted</p>
                        <p className="text-[#1a2a3a] font-semibold">{new Date(selectedDoctorDetails.approval.submittedAt).toLocaleDateString()}</p>
                      </div>
                      {selectedDoctorDetails.approval.adminMessage && (
                        <div className="col-span-2">
                          <p className="text-[#8a9ab0] mb-1">Admin Message</p>
                          <p className="text-[#f5576c] font-semibold">{selectedDoctorDetails.approval.adminMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-[#8a9ab0]">Failed to load doctor details</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#e0e8f0]">
                <button
                  onClick={handleCloseCertificate}
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
