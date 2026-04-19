import apiClient from './apiClient';

export const scheduleService = {
  /**
   * Get all 24 slots for a specific date
   * @param {string} scheduleDate - Date in YYYY-MM-DD format
   * @returns {Promise} Slots data with availability status
   */
  getSlotsForDate: (scheduleDate) =>
    apiClient.get('/schedule/date', { params: { scheduleDate } }),

  /**
   * Update a single slot availability
   * @param {string} scheduleDate - Date in YYYY-MM-DD format
   * @param {number} slotNumber - Slot number (1-8, 11-24)
   * @param {boolean} isAvailable - Whether slot is available
   * @returns {Promise}
   */
  updateSlotAvailability: (scheduleDate, slotNumber, isAvailable) =>
    apiClient.post('/schedule/slot', {
      scheduleDate,
      slotNumber,
      isAvailable,
    }),

  /**
   * Update multiple slots at once
   * @param {string} scheduleDate - Date in YYYY-MM-DD format
   * @param {object} slots - Object mapping slot numbers to availability status
   * @returns {Promise}
   */
  updateMultipleSlots: (scheduleDate, slotsObj) => {
    // Convert object { slotNumber: boolean } to array [ { slotNumber, isAvailable } ]
    const slotsArray = Object.entries(slotsObj).map(([slotNumber, isAvailable]) => ({
      slotNumber: parseInt(slotNumber),
      isAvailable: Boolean(isAvailable),
    }));
    
    return apiClient.post('/schedule/bulk', {
      scheduleDate,
      slots: slotsArray,
    });
  },

  /**
   * Get week schedule
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @returns {Promise} Week schedule for 7 days
   */
  getWeekSchedule: (startDate) =>
    apiClient.get('/schedule/week', { params: { startDate } }),

  /**
   * Get schedule for a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise}
   */
  getScheduleRange: (startDate, endDate) =>
    apiClient.get('/schedule/range', { params: { startDate, endDate } }),

  /**
   * Get slot time information
   * @returns {Promise} Slot times and info
   */
  getSlotTimes: () =>
    apiClient.get('/schedule/slot-times'),
};
