import api from './api'

/**
 * Doctor Service
 * Fetches doctor data from available slots
 * - Groups slots by doctor
 * - Extracts doctor details
 * - Removes duplicates
 * - Returns formatted doctor data with slots
 */

/**
 * Fetch all approved doctors for patient portal
 * @returns {Promise<Array>} Array of approved doctors with their info
 * Format: [{doctorId, doctorName, specialization, hospitalName, experience, email, rating, address}]
 * @throws Error if API call fails
 */
export const getAllDoctorsWithSlots = async () => {
  try {
    // Fetch approved doctors from backend
    const response = await api.get('/doctor-approvals/doctors/approved')
    const doctors = response.data

    // Validate response
    if (!Array.isArray(doctors)) {
      throw new Error('Invalid response format: doctors should be an array')
    }

    if (doctors.length === 0) {
      console.log('No approved doctors found')
      return []
    }

    // Transform doctor data to expected format
    const formattedDoctors = doctors.map(doctor => ({
      doctorId: doctor.doctorId,
      id: doctor.doctorId,
      name: doctor.doctorName,
      doctorName: doctor.doctorName,
      specialization: doctor.specialization || 'General Practice',
      hospitalName: doctor.hospitalName || 'N/A',
      experience: doctor.experience || 0,
      email: doctor.email,
      rating: doctor.rating || 0,
      address: doctor.address,
      isVerified: doctor.isVerified,
      slots: [] // Will be populated if needed separately
    }))

    // Sort by doctor name
    formattedDoctors.sort((a, b) => a.name.localeCompare(b.name))

    console.log(`✅ Loaded ${formattedDoctors.length} approved doctors`)

    return formattedDoctors
  } catch (error) {
    // Handle API errors
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'Failed to fetch doctors'
      console.error('🔴 API Error:', message)
      throw new Error(message)
    } else if (error.request) {
      console.error('🔴 Network Error: No response from server')
      throw new Error('No response from server. Please check your connection.')
    } else {
      console.error('🔴 Error:', error.message)
      throw error
    }
  }
}

/**
 * Get doctor by ID with their available slots
 * @param {number} doctorId - Doctor ID
 * @returns {Promise<Object>} Doctor with slots
 * Format: {doctorId, name, specialization, hospitalName, slots: []}
 * @throws Error if doctor not found or API call fails
 */
export const getDoctorById = async (doctorId) => {
  try {
    // Fetch all doctors
    const doctors = await getAllDoctorsWithSlots()

    // Find doctor by ID
    const doctor = doctors.find((d) => d.doctorId === parseInt(doctorId))

    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found`)
    }

    return doctor
  } catch (error) {
    console.error('Error fetching doctor:', error)
    throw error
  }
}

/**
 * Search doctors by name or specialization
 * @param {string} searchTerm - Search term (name or specialization)
 * @returns {Promise<Array>} Filtered doctors with slots
 * @throws Error if API call fails
 */
export const searchDoctors = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllDoctorsWithSlots()
    }

    // Fetch all doctors
    const doctors = await getAllDoctorsWithSlots()

    // Convert search term to lowercase
    const term = searchTerm.toLowerCase().trim()

    // Filter by name or specialization
    const filtered = doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(term) ||
        doctor.specialization.toLowerCase().includes(term) ||
        doctor.hospitalName.toLowerCase().includes(term)
    )

    console.log(
      `Search "${searchTerm}" returned ${filtered.length} doctors out of ${doctors.length}`
    )

    return filtered
  } catch (error) {
    console.error('Error searching doctors:', error)
    throw error
  }
}

/**
 * Filter doctors by specialization
 * @param {string} specialization - Specialization to filter by
 * @returns {Promise<Array>} Doctors with matching specialization
 * @throws Error if API call fails
 */
export const filterBySpecialization = async (specialization) => {
  try {
    if (!specialization) {
      return getAllDoctorsWithSlots()
    }

    const doctors = await getAllDoctorsWithSlots()

    const filtered = doctors.filter(
      (doctor) =>
        doctor.specialization.toLowerCase() === specialization.toLowerCase()
    )

    return filtered
  } catch (error) {
    console.error('Error filtering doctors:', error)
    throw error
  }
}

/**
 * Get unique specializations from all doctors
 * @returns {Promise<Array>} Array of unique specializations
 * @throws Error if API call fails
 */
export const getSpecializations = async () => {
  try {
    const doctors = await getAllDoctorsWithSlots()

    // Get unique specializations
    const specializations = [...new Set(doctors.map((d) => d.specialization))]

    // Sort alphabetically
    specializations.sort()

    return specializations
  } catch (error) {
    console.error('Error fetching specializations:', error)
    throw error
  }
}

/**
 * Get doctors count statistics
 * @returns {Promise<Object>} Statistics object
 * Format: {totalDoctors, totalSlots, doctorsBySpecialization: {}}
 * @throws Error if API call fails
 */
export const getDoctorsStats = async () => {
  try {
    const doctors = await getAllDoctorsWithSlots()

    // Calculate statistics
    const totalDoctors = doctors.length
    const totalSlots = doctors.reduce((sum, d) => sum + d.slots.length, 0)

    // Group by specialization
    const bySpecialization = {}
    doctors.forEach((doctor) => {
      const spec = doctor.specialization
      if (!bySpecialization[spec]) {
        bySpecialization[spec] = 0
      }
      bySpecialization[spec]++
    })

    return {
      totalDoctors,
      totalSlots,
      doctorsBySpecialization: bySpecialization,
    }
  } catch (error) {
    console.error('Error calculating statistics:', error)
    throw error
  }
}

export default {
  getAllDoctorsWithSlots,
  getDoctorById,
  searchDoctors,
  filterBySpecialization,
  getSpecializations,
  getDoctorsStats,
}
