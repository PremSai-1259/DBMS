import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import Navigation from '../components/Navigation'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'

const badgeStyles = {
  pending: { bg: '#eff6ff', text: '#2d5a8e', border: '#cfe0f7', label: 'Pending' },
  approved: { bg: '#f8fafc', text: '#475569', border: '#dbe3ef', label: 'Approved' },
  rejected: { bg: '#f8fafc', text: '#64748b', border: '#dbe3ef', label: 'Rejected' },
}

const approvalTabs = [
  {
    status: 'pending',
    label: 'Pending Reviews',
    emptyTitle: 'No Pending Requests',
    emptyMessage: 'All doctor profiles have been reviewed.',
  },
  {
    status: 'approved',
    label: 'Approved Doctors',
    emptyTitle: 'No Approved Doctors',
    emptyMessage: 'No doctor approvals have been marked as approved yet.',
  },
  {
    status: 'rejected',
    label: 'Rejected Requests',
    emptyTitle: 'No Rejected Requests',
    emptyMessage: 'No approvals have been rejected so far.',
  },
]

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { toast, showToast } = useToast()
  const [activeStatus, setActiveStatus] = useState('pending')
  const [approvalRecords, setApprovalRecords] = useState([])
  const [summaryCounts, setSummaryCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState(null)

  const activeTab = approvalTabs.find((tab) => tab.status === activeStatus) || approvalTabs[0]

  useEffect(() => {
    fetchApprovals(activeStatus)
  }, [activeStatus])

  const fetchApprovals = async (status = activeStatus) => {
    setLoading(true)
    try {
      const [listRes, summaryRes] = await Promise.all([
        profileService.getDoctorApprovalsByStatus(status),
        profileService.getDoctorApprovalSummary(),
      ])

      const approvals = listRes.data?.approvals || []
      setApprovalRecords(approvals)
      setSummaryCounts(summaryRes.data?.summary || listRes.data?.summary || {
        pending: status === 'pending' ? approvals.length : 0,
        approved: 0,
        rejected: 0,
      })
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load approval records', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCertificate = async (doctor) => {
    setSelectedDoctor(doctor)
    setSelectedDoctorDetails(null)
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
      await fetchApprovals(activeStatus)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve doctor', 'error')
      await fetchApprovals(activeStatus)
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
      await profileService.rejectDoctorRequest(selectedDoctor.approvalId, rejectReason.trim())
      showToast('Doctor request rejected', 'success')
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedDoctor(null)
      await fetchApprovals(activeStatus)
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject doctor', 'error')
      await fetchApprovals(activeStatus)
    } finally {
      setProcessingId(null)
    }
  }

  const downloadCertificate = async (fileId, fileName) => {
    try {
      await profileService.downloadFile(fileId, fileName)
      showToast('Certificate downloaded successfully', 'success')
    } catch (err) {
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

  const renderStatusSummary = (doctor) => {
    if (doctor.status === 'approved') {
      return `Approved${doctor.reviewedAt ? ` on ${new Date(doctor.reviewedAt).toLocaleDateString()}` : ''}`
    }

    if (doctor.status === 'rejected') {
      return `Rejected${doctor.reviewedAt ? ` on ${new Date(doctor.reviewedAt).toLocaleDateString()}` : ''}`
    }

    return `Submitted on ${new Date(doctor.submittedAt).toLocaleDateString()}`
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f7fb' }}>
      <Toast toast={toast} />
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-36 md:pt-40">
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-semibold text-[#1a2a3a]">Doctor Approval Requests</h1>
            <p className="mt-2 text-sm text-[#6b7280]">
              Review incoming doctor applications, certificates, and profile details.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {approvalTabs.map((item) => {
            const isActive = activeStatus === item.status
            const count = summaryCounts[item.status] ?? 0

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveStatus(item.status)}
                className="rounded-2xl border bg-white p-6 text-left transition-all duration-200"
                style={{
                  borderColor: isActive ? '#2d5a8e' : '#e6ecf5',
                  boxShadow: isActive ? '0 10px 24px rgba(45,90,142,0.12)' : '0 4px 18px rgba(45,90,142,0.06)',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-sm font-medium text-[#6b7280]">{item.label}</p>
                    <div className="text-4xl font-bold text-[#1a2a3a]">{count}</div>
                  </div>
                  <div
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ background: isActive ? '#2d5a8e' : '#94a3b8' }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        <div className="mb-4 text-sm text-[#6b7280]">
          Tap a card to filter the table by status. Showing {activeTab.label.toLowerCase()}.
        </div>

        <div className="mb-8 flex justify-end">
          <button
            onClick={() => navigate('/notifications')}
            className="mr-3 rounded-xl border px-4 py-2 font-medium transition-all duration-200"
            style={{
              background: '#ffffff',
              color: '#4a5a6a',
              borderColor: '#d5deea',
            }}
          >
            Notifications
          </button>
          <button
            onClick={() => fetchApprovals(activeStatus)}
            disabled={loading}
            className="rounded-xl border px-4 py-2 font-medium transition-all duration-200"
            style={{
              background: loading ? '#eef2f7' : '#ffffff',
              color: '#2d5a8e',
              borderColor: '#d5deea',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 inline-block text-4xl">⏳</div>
            <p className="text-[#8a9ab0]">Loading {activeTab.label.toLowerCase()}...</p>
          </div>
        )}

        {!loading && approvalRecords.length === 0 && (
          <div
            className="rounded-2xl border bg-white py-14 text-center"
            style={{ borderColor: '#e6ecf5', boxShadow: '0 4px 18px rgba(45,90,142,0.06)' }}
          >
            <div className="mb-4 text-5xl">✅</div>
            <p className="mb-2 text-lg font-semibold text-[#1a2a3a]">{activeTab.emptyTitle}</p>
            <p className="text-[#6b7280]">{activeTab.emptyMessage}</p>
          </div>
        )}

        {!loading && approvalRecords.length > 0 && (
          <div className="space-y-4">
            {approvalRecords.map((doctor) => {
              const badge = badgeStyles[doctor.status] || badgeStyles.pending

              return (
                <div
                  key={doctor.approvalId}
                  className="overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-lg"
                  style={{ borderColor: '#e6ecf5', boxShadow: '0 2px 12px rgba(45,90,142,0.06)' }}
                >
                  <div className="p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-xl font-bold text-[#1a2a3a]">{doctor.doctor.name}</h3>
                          <span
                            className="rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap"
                            style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="mb-4 text-sm text-[#6b7280]">{doctor.doctor.email}</p>

                        <div
                          className="mb-4 grid grid-cols-2 gap-3 rounded-xl p-4"
                          style={{ background: '#f8fafc', border: '1px solid #e6ecf5' }}
                        >
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a5a6a]">Specialization</p>
                            <p className="text-sm font-semibold text-[#1a2a3a]">{doctor.doctor.specialization || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a5a6a]">Experience</p>
                            <p className="text-sm font-semibold text-[#1a2a3a]">{doctor.doctor.experience || 0} yrs</p>
                          </div>
                          <div className="col-span-2">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a5a6a]">Hospital / Clinic</p>
                            <p className="text-sm font-semibold text-[#1a2a3a]">{doctor.doctor.hospitalName || 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a5a6a]">Address</p>
                            <p className="text-sm font-semibold text-[#1a2a3a]">{doctor.doctor.address || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a5a6a]">Status</p>
                            <p className="text-sm font-semibold text-[#1a2a3a] capitalize">{doctor.status}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a5a6a]">
                              {doctor.status === 'pending' ? 'Submitted' : 'Reviewed'}
                            </p>
                            <p className="text-sm font-semibold text-[#1a2a3a]">
                              {doctor.status === 'pending'
                                ? new Date(doctor.submittedAt).toLocaleDateString()
                                : doctor.reviewedAt
                                  ? new Date(doctor.reviewedAt).toLocaleDateString()
                                  : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-center">
                        <div className="mb-3 text-4xl">📄</div>
                        <button
                          onClick={() => handleViewCertificate(doctor)}
                          className="mb-2 block whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all duration-200"
                          style={{ background: '#2d5a8e' }}
                        >
                          View Details
                        </button>
                        {doctor.certificateFileId ? (
                          <button
                            onClick={() => downloadCertificate(doctor.certificateFileId, `certificate-${doctor.doctor.id}.pdf`)}
                            className="block text-xs font-medium text-[#64748b] transition-colors hover:text-[#1a2a3a]"
                          >
                            Download
                          </button>
                        ) : (
                          <span className="block text-xs font-medium text-[#cbd5e1]">No certificate</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#e6ecf5] pt-4">
                      {doctor.status === 'pending' ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(doctor.approvalId)}
                            disabled={processingId === doctor.approvalId}
                            className="flex-1 rounded-lg py-3 font-semibold text-white transition-all duration-200"
                            style={{
                              background: processingId === doctor.approvalId ? '#a8c5e0' : '#2d5a8e',
                              cursor: processingId === doctor.approvalId ? 'not-allowed' : 'pointer',
                              opacity: processingId === doctor.approvalId ? 0.7 : 1,
                            }}
                          >
                            {processingId === doctor.approvalId ? 'Processing...' : 'Approve Doctor'}
                          </button>
                          <button
                            onClick={() => handleRejectClick(doctor)}
                            disabled={processingId === doctor.approvalId}
                            className="flex-1 rounded-lg border py-3 font-semibold transition-all duration-200"
                            style={{
                              background: '#ffffff',
                              color: '#6b7280',
                              borderColor: '#d5deea',
                              cursor: processingId === doctor.approvalId ? 'not-allowed' : 'pointer',
                              opacity: processingId === doctor.approvalId ? 0.7 : 1,
                            }}
                          >
                            Reject Request
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div
                            className="rounded-lg py-3 text-center font-semibold"
                            style={{ background: '#f8fafc', color: '#64748b' }}
                          >
                            {renderStatusSummary(doctor)}
                          </div>

                          {doctor.status === 'rejected' && doctor.adminMessage && (
                            <div className="rounded-lg border border-[#f1d7d7] bg-[#fff7f7] px-4 py-3 text-sm text-[#9f3a3a]">
                              <p className="mb-1 font-semibold">Rejection reason</p>
                              <p>{doctor.adminMessage}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedDoctor && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15, 23, 42, 0.48)' }}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            <div className="sticky top-0 border-b border-[#e6ecf5] px-6 py-5" style={{ background: '#f8fafc' }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">
                    {selectedDoctor.doctor.name} - Complete Profile & Documents
                  </h3>
                  <p className="mt-1 text-sm text-[#6b7280]">Review the doctor profile and uploaded certificate files.</p>
                </div>
                <button
                  onClick={handleCloseCertificate}
                  className="text-2xl leading-none text-[#6b7280] transition-opacity hover:opacity-70"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 inline-block text-4xl">⏳</div>
                  <p className="text-[#8a9ab0]">Loading doctor details...</p>
                </div>
              ) : selectedDoctorDetails ? (
                <>
                  <div className="mb-6 rounded-xl border p-6" style={{ background: '#f8fafc', borderColor: '#e6ecf5' }}>
                    <h4 className="mb-4 text-lg font-semibold text-[#1a2a3a]">Doctor Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 font-medium text-[#6b7280]">Name</p>
                        <p className="font-semibold text-[#1a2a3a]">{selectedDoctorDetails.doctor.name}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-[#6b7280]">Email</p>
                        <p className="font-semibold text-[#1a2a3a]">{selectedDoctorDetails.doctor.email}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-[#6b7280]">Specialization</p>
                        <p className="font-semibold text-[#1a2a3a]">{selectedDoctorDetails.doctor.specialization}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-[#6b7280]">Experience</p>
                        <p className="font-semibold text-[#1a2a3a]">{selectedDoctorDetails.doctor.experience} years</p>
                      </div>
                      <div className="col-span-2">
                        <p className="mb-1 font-medium text-[#6b7280]">Hospital / Clinic</p>
                        <p className="font-semibold text-[#1a2a3a]">{selectedDoctorDetails.doctor.hospitalName}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="mb-1 font-medium text-[#6b7280]">Address</p>
                        <p className="font-semibold text-[#1a2a3a]">{selectedDoctorDetails.doctor.address}</p>
                      </div>
                    </div>
                  </div>

                  {selectedDoctorDetails.certificateFile && (
                    <div className="mb-6 rounded-xl border-2 border-dashed p-6" style={{ background: '#f8fafc', borderColor: '#cfe0f7' }}>
                      <h4 className="mb-4 font-semibold text-[#1a2a3a]">Primary Certificate</h4>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[#1a2a3a]">{selectedDoctorDetails.certificateFile.name}</p>
                          <p className="mt-1 text-xs text-[#6b7280]">ID: {selectedDoctorDetails.certificateFile.id}</p>
                        </div>
                        <button
                          onClick={() => downloadCertificate(selectedDoctorDetails.certificateFile.id, selectedDoctorDetails.certificateFile.name)}
                          className="rounded-lg px-5 py-2 font-medium text-white transition-all duration-200"
                          style={{ background: '#2d5a8e' }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="mb-4 font-semibold text-[#1a2a3a]">
                      All Uploaded Files ({selectedDoctorDetails.allFiles?.length || 0})
                    </h4>
                    {selectedDoctorDetails.allFiles?.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDoctorDetails.allFiles.map((file, index) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between gap-4 rounded-xl border p-4"
                            style={{ background: index % 2 === 0 ? '#f8fafc' : '#ffffff', borderColor: '#e6ecf5' }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#1a2a3a]">{index + 1}. {file.name}</p>
                              <div className="mt-2 flex gap-4 text-xs text-[#6b7280]">
                                <span>Type: <strong>{file.type}</strong></span>
                                <span>Uploaded: <strong>{new Date(file.uploadedAt).toLocaleDateString()}</strong></span>
                                <span>Hash: <strong>{file.hashValue?.substring(0, 16)}...</strong></span>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadCertificate(file.id, file.name)}
                              className="flex-shrink-0 rounded-lg px-4 py-2 font-medium text-white transition-all duration-200"
                              style={{ background: '#64748b' }}
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-[#f8fafc] p-4 text-center">
                        <p className="text-[#6b7280]">No additional files uploaded</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 rounded-xl border p-4" style={{ background: '#f8fafc', borderColor: '#e6ecf5' }}>
                    <h4 className="mb-3 font-semibold text-[#1a2a3a]">Approval Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 text-[#6b7280]">Status</p>
                        <p className="font-semibold capitalize text-[#1a2a3a]">{selectedDoctorDetails.approval.status}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[#6b7280]">Submitted</p>
                        <p className="font-semibold text-[#1a2a3a]">{new Date(selectedDoctorDetails.approval.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[#6b7280]">Reviewed</p>
                        <p className="font-semibold text-[#1a2a3a]">
                          {selectedDoctorDetails.approval.reviewedAt
                            ? new Date(selectedDoctorDetails.approval.reviewedAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      {selectedDoctorDetails.approval.adminMessage && (
                        <div className="col-span-2">
                          <p className="mb-1 text-[#6b7280]">Admin Message</p>
                          <p className="font-semibold text-[#3a7bd5]">{selectedDoctorDetails.approval.adminMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-4 text-4xl">❌</div>
                  <p className="text-[#6b7280]">Failed to load doctor details</p>
                </div>
              )}

              <div className="border-t border-[#e6ecf5] pt-4">
                <button
                  onClick={handleCloseCertificate}
                  className="w-full rounded-lg border px-4 py-2.5 font-medium text-[#2d5a8e] transition-colors hover:bg-[#f8fafc]"
                  style={{ borderColor: '#d5deea' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15, 23, 42, 0.48)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white" style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            <div className="border-b border-[#e6ecf5] px-6 py-5" style={{ background: '#f8fafc' }}>
              <h3 className="text-lg font-semibold text-[#1a2a3a]">Reject Application</h3>
              <p className="mt-1 text-sm text-[#6b7280]">for {selectedDoctor?.doctor?.name}</p>
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm text-[#6b7280]">
                Please provide a reason for rejecting this doctor&apos;s profile. This will be sent to the doctor.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (minimum 10 characters)..."
                rows={4}
                className="w-full resize-none rounded-xl border border-[#d0daea] px-4 py-3 transition-all focus:outline-none"
                style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8fafc' }}
              />

              <div className="mt-2 text-xs text-[#6b7280]">
                Characters: {rejectReason.length} (minimum 10)
              </div>
            </div>

            <div className="flex gap-3 border-t border-[#e6ecf5] px-6 py-5">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setSelectedDoctor(null)
                }}
                className="flex-1 rounded-lg border border-[#d5deea] py-2.5 font-medium text-[#6b7280] transition-colors hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processingId !== null || rejectReason.trim().length < 10}
                className="flex-1 rounded-lg py-2.5 font-medium text-white transition-all duration-200"
                style={{
                  background: rejectReason.trim().length < 10 ? '#a8c5e0' : '#2d5a8e',
                  cursor: rejectReason.trim().length < 10 || processingId !== null ? 'not-allowed' : 'pointer',
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
