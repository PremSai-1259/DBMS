import api, { setToken, removeToken } from './api'

/**
 * Authentication Service
 * Handles user login and signup
 * - Stores JWT token in localStorage
 * - Returns user data and token
 * - Handles errors cleanly
 */

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} {user, token}
 * @throws Error with message if login fails
 */
export const login = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Make API request
    const response = await api.post('/auth/login', {
      email,
      password,
    })

    // Extract data from response
    const { user, token } = response.data

    // Validate response data
    if (!token) {
      throw new Error('No token received from server')
    }

    if (!user) {
      throw new Error('No user data received from server')
    }

    // Store token in localStorage
    setToken(token)

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user))

    console.log('Login successful:', user.email)

    // Return user and token
    return {
      user,
      token,
    }
  } catch (error) {
    // Handle different error types
    if (error.response) {
      // API error response
      const message = error.response.data?.message || 'Login failed'
      const status = error.response.status

      if (status === 401) {
        throw new Error('Invalid email or password')
      } else if (status === 400) {
        throw new Error(message)
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      throw new Error(message)
    } else if (error.request) {
      // No response from server
      throw new Error('No response from server. Please check your connection.')
    } else {
      // Other errors (validation, etc)
      throw error
    }
  }
}

/**
 * Register new user
 * @param {Object} data - User registration data
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.email - Email address
 * @param {string} data.password - Password
 * @param {string} data.role - User role (patient/doctor)
 * @param {string} data.phone - Phone number (optional)
 * @returns {Promise} {user, token}
 * @throws Error with message if signup fails
 */
export const signup = async (data) => {
  try {
    // Validate required fields
    const { firstName, lastName, email, password, role } = data

    if (!firstName || !lastName || !email || !password || !role) {
      throw new Error('First name, last name, email, password, and role are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address')
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Make API request
    const response = await api.post('/auth/signup', {
      firstName,
      lastName,
      email,
      password,
      role,
      phone: data.phone || '',
    })

    // Extract data from response
    const { user, token } = response.data

    // Validate response data
    if (!token) {
      throw new Error('No token received from server')
    }

    if (!user) {
      throw new Error('No user data received from server')
    }

    // Store token in localStorage
    setToken(token)

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user))

    console.log('Signup successful:', user.email)

    // Return user and token
    return {
      user,
      token,
    }
  } catch (error) {
    // Handle different error types
    if (error.response) {
      // API error response
      const message = error.response.data?.message || 'Signup failed'
      const status = error.response.status

      if (status === 409) {
        throw new Error('Email already registered. Please login or use another email.')
      } else if (status === 400) {
        throw new Error(message)
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      throw new Error(message)
    } else if (error.request) {
      // No response from server
      throw new Error('No response from server. Please check your connection.')
    } else {
      // Other errors (validation, etc)
      throw error
    }
  }
}

/**
 * Logout user
 * Clears token and user data from localStorage
 */
export const logout = () => {
  try {
    // Remove token and user data
    removeToken()
    console.log('Logout successful')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

/**
 * Get stored user data from localStorage
 * @returns {Object|null} User object or null if not found
 */
export const getStoredUser = () => {
  try {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Error parsing stored user data:', error)
    return null
  }
}

/**
 * Check if user is currently logged in
 * @returns {boolean} True if user is logged in
 */
export const isLoggedIn = () => {
  return !!getStoredUser()
}

export default {
  login,
  signup,
  logout,
  getStoredUser,
  isLoggedIn,
}
