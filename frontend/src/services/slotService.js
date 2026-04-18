import apiClient from './apiClient'

export const slotService = {
  // Get available slots (filters optional: doctor, date, etc.)
  getAvailableSlots: (filters = {}) =>
    apiClient.get('/slots/available', { params: filters }),
  
  // Get all slots
  getAllSlots: () =>
    apiClient.get('/slots'),
  
  /**
   * Get slots by doctor ID
   * NOTE: Backend does not currently provide a dedicated endpoint.
   * Use getAvailableSlots with doctor filter instead.
   * @param {number} doctorId - Doctor ID
   * @throws Error indicating to use getAvailableSlots with filters
   */
  getSlotsByDoctor: (doctorId) => {
    throw new Error('Use getAvailableSlots({ doctor: doctorId }) instead')
  },
  
  /**
   * Get doctor schedule
   * NOTE: Backend does not currently provide this endpoint.
   * Use getAvailableSlots with filters instead.
   * @param {number} doctorId - Doctor ID
   * @throws Error indicating to use getAvailableSlots with filters
   */
  getDoctorSchedule: (doctorId) => {
    throw new Error('Use getAvailableSlots({ doctor: doctorId }) instead')
  },
}
