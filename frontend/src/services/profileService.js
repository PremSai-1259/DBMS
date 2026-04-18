import apiClient from './apiClient'

export const profileService = {
  // Get profile (backend handles role routing via middleware)
  getProfile: () =>
    apiClient.get('/profile'),
  
  // Create profile (backend handles role routing via middleware)
  createProfile: (profileData) =>
    apiClient.post('/profile', profileData),
  
  // Update profile (backend handles role routing via middleware)
  updateProfile: (profileData) =>
    apiClient.put('/profile', profileData),
}
