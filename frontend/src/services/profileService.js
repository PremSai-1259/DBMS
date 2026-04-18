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

  // Admin: Approve doctor request
  approveDoctorRequest: (approvalId) =>
    api.put(`/doctor-approvals/${approvalId}/approve`),

  // Admin: Reject doctor request
  rejectDoctorRequest: (approvalId, adminMessage) =>
    api.put(`/doctor-approvals/${approvalId}/reject`, { adminMessage }),

  // Get file info
  getFileInfo: (fileId) =>
    api.get(`/files/${fileId}/info`),
}
