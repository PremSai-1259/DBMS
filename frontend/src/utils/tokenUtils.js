/**
 * Token Utility Functions
 * Handles JWT token operations and validation
 */

/**
 * Decode JWT token payload (without verification)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 * 
 * Note: This only decodes the token, it does NOT verify the signature.
 * For security, always verify tokens on the backend.
 */
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null
    }

    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid token format')
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]

    // Add padding if necessary
    const paddedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    // Calculate padding
    const padLength = (4 - (paddedPayload.length % 4)) % 4
    const paddedPayloadWithPadding = paddedPayload + '='.repeat(padLength)

    // Decode base64
    const decoded = atob(paddedPayloadWithPadding)
    const payload_obj = JSON.parse(decoded)

    return payload_obj
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Get user role from token
 * @param {string} token - JWT token
 * @returns {string|null} User role or null if not found
 */
export const getRoleFromToken = (token) => {
  const payload = decodeToken(token)
  return payload?.role || null
}

/**
 * Get user ID from token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if not found
 */
export const getUserIdFromToken = (token) => {
  const payload = decodeToken(token)
  return payload?.id || payload?.userId || payload?.sub || null
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  try {
    const payload = decodeToken(token)
    if (!payload || !payload.exp) {
      return true
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp <= currentTime
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}

/**
 * Get user email from token
 * @param {string} token - JWT token
 * @returns {string|null} User email or null if not found
 */
export const getEmailFromToken = (token) => {
  const payload = decodeToken(token)
  return payload?.email || payload?.sub || null
}

/**
 * Validate token format
 * @param {string} token - JWT token
 * @returns {boolean} True if token format is valid
 */
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  return parts.length === 3
}

/**
 * Extract all token data
 * @param {string} token - JWT token
 * @returns {Object} Token data including role, email, id, and expiration
 */
export const getTokenData = (token) => {
  const payload = decodeToken(token)

  if (!payload) {
    return {
      valid: false,
      role: null,
      email: null,
      id: null,
      exp: null,
      isExpired: true,
    }
  }

  return {
    valid: true,
    role: payload.role || null,
    email: payload.email || payload.sub || null,
    id: payload.id || payload.userId || payload.sub || null,
    exp: payload.exp || null,
    isExpired: isTokenExpired(token),
    payload,
  }
}
