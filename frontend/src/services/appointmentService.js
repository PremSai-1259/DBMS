import api from './api'

const formatTimeRange = (slotStartTime, slotEndTime) => {
  if (!slotStartTime || !slotEndTime) return null

  const formatSingleTime = (timeValue) => {
    const [hours = '00', minutes = '00'] = String(timeValue).split(':')
    const date = new Date()
    date.setHours(Number(hours), Number(minutes), 0, 0)

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return `${formatSingleTime(slotStartTime)} - ${formatSingleTime(slotEndTime)}`
}

/**
 * Appointment Service
 * Handles all appointment-related API calls
 * - Automatically includes auth token in requests
 * - Handles errors gracefully
 * - Returns formatted responses
 */

/**
 * Book an appointment with a doctor
 * @param {Object} data - Booking data
 * @param {number} data.slotId - ID of the selected slot (required)
 * @param {number} data.doctorId - ID of the doctor (optional, can be from slot)
 * @returns {Promise<Object>} Appointment data
 * @throws Error if booking fails
 */
export const bookAppointment = async (data) => {
  try {
    // Validate required fields
    if (!data || !data.slotId) {
      throw new Error('Slot ID is required to book an appointment')
    }

    const requestBody = {
      slotId: data.slotId,
      doctorId: data.doctorId || null,
    }
    
    console.log('📤 [bookAppointment] Sending request:', requestBody)

    // Make API request
    const response = await api.post('/appointments/book', requestBody)

    console.log('✅ Appointment booked successfully:', response.data)

    return response.data
  } catch (error) {
    // Handle different error scenarios
    if (error.response) {
      const message =
        error.response.data?.message || error.response.data?.error || 'Failed to book appointment'
      const status = error.response.status

      if (status === 400) {
        throw new Error(`Booking validation error: ${message}`)
      } else if (status === 409) {
        throw new Error('This slot is no longer available. Please select another.')
      } else if (status === 401) {
        throw new Error('Please login to book an appointment')
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

/**
 * Get all appointments for the current user
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (pending, completed, cancelled)
 * @param {string} filters.sortBy - Sort by field (date, status, doctorName)
 * @returns {Promise<Array>} Array of appointment objects
 * @throws Error if API call fails
 */
export const getAppointments = async (filters = {}) => {
  try {
    // Build query parameters
    const params = {}
    if (filters.status) {
      params.status = filters.status
    }
    if (filters.sortBy) {
      params.sortBy = filters.sortBy
    }

    // Make API request
    const response = await api.get('/appointments', { params })

    // Validate response - backend returns {total, appointments: Array}
    let appointments = response.data
    if (!Array.isArray(appointments)) {
      appointments = response.data?.appointments || []
    }

    appointments = appointments.map((appointment) => {
      const slotDate = appointment.slotDate || appointment.date || appointment.slot?.date || null
      const slotStartTime = appointment.slotStartTime || appointment.slot?.startTime || null
      const slotEndTime = appointment.slotEndTime || appointment.slot?.endTime || null
      const time = appointment.time || appointment.slot?.time || formatTimeRange(slotStartTime, slotEndTime)

      return {
        ...appointment,
        date: slotDate,
        time,
        patientName: appointment.patientName || appointment.doctorName || 'Patient',
        doctorName: appointment.doctorName || appointment.patientName || 'Doctor',
        consultation: appointment.consultationId
          ? {
              id: appointment.consultationId,
              reasonForVisit: appointment.reasonForVisit || '',
              diagnosis: appointment.diagnosis || '',
              prescription: appointment.prescription || '',
              additionalNotes: appointment.additionalNotes || '',
              createdAt: appointment.consultationCreatedAt || null,
              updatedAt: appointment.consultationUpdatedAt || null,
            }
          : null,
        slot: {
          ...(appointment.slot || {}),
          date: slotDate,
          time,
          startTime: slotStartTime,
          endTime: slotEndTime,
          slotNumber: appointment.slotNumber || appointment.slot?.slotNumber || null,
        },
      }
    })

    console.log(`Loaded ${appointments.length} appointments`)

    return appointments
  } catch (error) {
    // Handle different error scenarios
    if (error.response) {
      const message =
        error.response.data?.message || 'Failed to fetch appointments'
      const status = error.response.status

      if (status === 401) {
        throw new Error('Please login to view appointments')
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

/**
 * Get a single appointment by ID
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<Object>} Appointment details
 * @throws Error if appointment not found or API call fails
 */
export const getAppointmentById = async (appointmentId) => {
  try {
    if (!appointmentId) {
      throw new Error('Appointment ID is required')
    }

    const response = await api.get(`/appointments/${appointmentId}`)

    console.log('Fetched appointment:', response.data)

    return response.data
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to fetch appointment'
      const status = error.response.status

      if (status === 404) {
        throw new Error('Appointment not found')
      } else if (status === 401) {
        throw new Error('Please login to view this appointment')
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

/**
 * Cancel an appointment as a patient
 * @param {number} appointmentId - ID of appointment to cancel
 * @param {string} reason - Optional reason for cancellation
 * @returns {Promise<Object>} Updated appointment data
 * @throws Error if cancellation fails
 */
export const cancelAppointment = async (appointmentId, reason = '') => {
  try {
    if (!appointmentId) {
      throw new Error('Appointment ID is required')
    }

    // Make API request
    const response = await api.put(`/appointments/cancel/${appointmentId}`, {
      cancelReason: reason || 'No reason provided',
    })

    console.log('Appointment cancelled successfully:', response.data)

    return response.data
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to cancel appointment'
      const status = error.response.status

      if (status === 400) {
        throw new Error(`Cannot cancel: ${message}`)
      } else if (status === 404) {
        throw new Error('Appointment not found')
      } else if (status === 401) {
        throw new Error('Please login to cancel appointments')
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

/**
 * Reschedule an appointment to a different slot
 * NOTE: This endpoint is not yet implemented in backend
 * To reschedule: cancel current appointment and book new one
 * @param {number} appointmentId - ID of appointment to cancel
 * @returns {Promise<Object>} Cancelled appointment data
 * @throws Error if cancellation fails
 */
export const rescheduleAppointment = async (appointmentId) => {
  throw new Error('Reschedule not yet implemented. Please cancel and rebook the appointment.')
}

/**
 * Add consultation notes to an appointment (for doctors)
 * @param {number} appointmentId - Appointment ID
 * @param {Object} noteData - Consultation note data
 * @param {string} noteData.notes - Consultation notes (required)
 * @param {string} noteData.prescription - Prescription (optional)
 * @returns {Promise<Object>} Created consultation note
 * @throws Error if adding notes fails
 */
export const addConsultationNote = async (appointmentId, noteData) => {
  try {
    if (!appointmentId || !noteData) {
      throw new Error('Appointment ID and consultation details are required')
    }

    const response = await api.post('/consultation', {
      appointmentId,
      reasonForVisit: noteData.reasonForVisit || '',
      diagnosis: noteData.diagnosis || '',
      prescription: noteData.prescription || '',
      additionalNotes: noteData.additionalNotes || '',
    })

    console.log('Consultation note added:', response.data)

    return response.data
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to add consultation note'
      const status = error.response.status

      if (status === 400) {
        throw new Error(`Validation error: ${message}`)
      } else if (status === 404) {
        throw new Error('Appointment not found')
      } else if (status === 403) {
        throw new Error('Only doctors can add consultation notes')
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

/**
 * Doctor-cancel an appointment with a required reason
 * @param {number} appointmentId - Appointment ID
 * @param {string} cancelReason - Reason shown to the patient
 * @returns {Promise<Object>} Updated appointment data
 */
export const doctorCancelAppointment = async (appointmentId, cancelReason) => {
  try {
    if (!appointmentId) {
      throw new Error('Appointment ID is required')
    }

    if (!cancelReason || !cancelReason.trim()) {
      throw new Error('Cancellation reason is required')
    }

    const response = await api.put(`/appointments/cancel/${appointmentId}`, {
      cancelReason: cancelReason.trim(),
    })

    return response.data
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'Failed to cancel appointment'
      const status = error.response.status

      if (status === 400) {
        throw new Error(`Cannot cancel: ${message}`)
      } else if (status === 401) {
        throw new Error('Please login to cancel appointments')
      } else if (status === 403) {
        throw new Error(message)
      } else if (status === 404) {
        throw new Error('Appointment not found')
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

export const updateConsultationNote = async (consultationId, noteData) => {
  try {
    if (!consultationId || !noteData) {
      throw new Error('Consultation ID and consultation details are required')
    }

    const response = await api.put(`/consultation/${consultationId}`, {
      reasonForVisit: noteData.reasonForVisit || '',
      diagnosis: noteData.diagnosis || '',
      prescription: noteData.prescription || '',
      additionalNotes: noteData.additionalNotes || '',
    })

    return response.data
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'Failed to update consultation note'
      throw new Error(message)
    } else if (error.request) {
      throw new Error('Unable to reach server. Please check your connection.')
    } else {
      throw error
    }
  }
}

/**
 * Get appointments for current user (auto-detects patient/doctor)
 * Alias for getAppointments() - use that instead
 * @returns {Promise<Array>} Array of user's appointments
 * @throws Error if API call fails
 */
export const getUserAppointments = async () => {
  return getAppointments()
}

/**
 * Get appointment statistics
 * NOTE: This endpoint is not yet implemented in backend
 * @returns {Promise<Object>} Statistics object
 * @throws Error with message that feature is not available
 */
export const getAppointmentStats = async () => {
  throw new Error('Appointment statistics endpoint is not yet implemented in the backend')
}

export default {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  doctorCancelAppointment,
  rescheduleAppointment,
  addConsultationNote,
  updateConsultationNote,
  getUserAppointments,
  getAppointmentStats,
}
