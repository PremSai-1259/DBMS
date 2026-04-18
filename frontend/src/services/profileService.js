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

  // Upload file - FormData bypasses default JSON Content-Type
  uploadFile: (formData) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Get uploaded files
  getUploadedFiles: () =>
    api.get('/files'),

  // Delete file
  deleteFile: (fileId) =>
    api.delete(`/files/${fileId}`),

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
