import api from './api'

export const profileService = {
  // Get profile (backend handles role routing via middleware)
  getProfile: () =>
    api.get('/profile'),
  
  // Create profile (backend handles role routing via middleware)
  createProfile: (profileData) =>
    api.post('/profile', profileData),
  
  // Update profile (backend handles role routing via middleware)
  updateProfile: (profileData) =>
    api.put('/profile', profileData),

  // Upload file - Let axios auto-detect FormData and set boundary
  uploadFile: (formData) => {
    return api.post('/files/upload', formData)
  },

  // Get uploaded files
  getUploadedFiles: () =>
    api.get('/files'),

  // Delete file
  deleteFile: (fileId) =>
    api.delete(`/files/${fileId}`),

  // Doctor: Check own approval status
  getApprovalStatus: () =>
    api.get('/doctor-approvals/status'),

  // Request doctor approval with certificate
  requestDoctorApproval: (certificateFileId) =>
    api.post('/doctor-approvals/request', { certificateFileId }),

  // Admin: Get pending doctor approvals
  getPendingDoctorApprovals: () =>
    api.get('/doctor-approvals/pending'),

  // Admin: Get doctor approvals by status
  getDoctorApprovalsByStatus: (status) =>
    api.get('/doctor-approvals/list', { params: { status } }),

  // Admin: Get dashboard summary counts
  getDoctorApprovalSummary: () =>
    api.get('/doctor-approvals/summary'),

  // Admin: Get doctor details and uploaded files (NEW)
  getDoctorApprovalDetails: (doctorId) =>
    api.get(`/doctor-approvals/doctor/${doctorId}/details`),

  // Admin: Approve doctor request
  approveDoctorRequest: (approvalId) =>
    api.put(`/doctor-approvals/${approvalId}/approve`),

  // Admin: Reject doctor request
  rejectDoctorRequest: (approvalId, adminMessage) =>
    api.put(`/doctor-approvals/${approvalId}/reject`, { adminMessage }),

  // Get file info
  getFileInfo: (fileId) =>
    api.get(`/files/${fileId}/info`),

  // Fetch a file as a blob using authenticated headers
  fetchFileBlob: async (fileId) => {
    const response = await api.get(`/files/${fileId}`, {
      responseType: 'blob',
      timeout: 30000
    })

    return {
      blob: response.data,
      contentType: response.headers?.['content-type'] || 'application/octet-stream'
    }
  },

  // Doctor: get patient profile summary from shared appointments
  getDoctorPatientSummary: (patientId) =>
    api.get(`/appointments/patient/${patientId}/summary`),

  // Doctor: request access to a patient's uploaded medical report
  requestMedicalReportAccess: (patientId, fileId) =>
    api.post('/access/request', { patientId, fileId }),

  // Patient: Get medical report requests from doctors
  getMedicalRequests: () =>
    api.get('/access/requests'),

  // Patient: Respond to a medical report request (approve or reject)
  respondToMedicalRequest: (requestId, status) =>
    api.put(`/access/respond/${requestId}`, { status }),

  // Patient: Revoke previously approved access
  revokeMedicalAccess: (requestId) =>
    api.put(`/access/revoke/${requestId}`),

  // Patient: Get doctor profile with appointment history
  getDoctorProfileWithHistory: (doctorId) =>
    api.get(`/appointments/doctor/${doctorId}/profile`),

  // Download file with auth headers
  downloadFile: async (fileId, fileName) => {
    try {
      const { blob } = await profileService.fetchFileBlob(fileId)
      
      // Create blob and download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName || `file-${fileId}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  },

  // Preview file in-browser without triggering a download
  previewFile: async (fileId) => {
    const { blob, contentType } = await profileService.fetchFileBlob(fileId)
    const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: contentType }))

    return {
      url: blobUrl,
      contentType
    }
  },
}
