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

  // Download file with auth headers
  downloadFile: async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout for downloads
      })
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]))
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
}
