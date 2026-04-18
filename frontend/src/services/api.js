import axios from 'axios'

/**
 * Axios instance configured for Hospital Management API
 * - Base URL: http://localhost:5000/api
 * - Automatically adds JWT token from localStorage
 * - Handles missing token safely
 * - Intercepts 401 responses for token expiration
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

/**
 * Request interceptor - Add token to every request
 * Handles missing token safely by checking localStorage first
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken')

    // Add token to Authorization header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Log warning if no token found (safe to continue)
      console.warn('No authentication token found in localStorage')
    }

    // For FormData, remove the default JSON Content-Type and let axios/browser set multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    // Handle request error
    console.error('Request error:', error.message)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor - Handle authentication errors
 * Redirects to login on 401 (token expired or invalid)
 */
api.interceptors.response.use(
  (response) => {
    // Return successful response
    return response
  },
  (error) => {
    // Log full error details
    console.error('API Error Response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.response?.config?.url,
      message: error.response?.data?.message || error.message
    })

    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect
      console.error('🔴 Unauthorized - Token expired or invalid')
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')

      // Redirect to login page
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin'
      }
    } else if (error.response?.status === 403) {
      // Access forbidden - user doesn't have permission
      console.error('🔴 Forbidden - Access denied')
    } else if (error.response?.status === 404) {
      // Resource not found
      console.error('🔴 Not found - Resource does not exist')
    } else if (error.response?.status === 500) {
      // Server error
      console.error('🔴 Server error - Please try again later')
    } else if (error.message === 'Network Error') {
      // Network error
      console.error('🔴 Network error - Please check your connection')
    }

    return Promise.reject(error)
  }
)

/**
 * Helper function to get token safely
 * @returns {string|null} Token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem('authToken')
}

/**
 * Helper function to check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken')
}

/**
 * Helper function to set token in localStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token)
  }
}

/**
 * Helper function to remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

export default api
