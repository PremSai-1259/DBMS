class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response
    const message = data?.message || 'An error occurred'
    return new APIError(message, status, data)
  }
  
  if (error.request) {
    return new APIError('No response from server', null, null)
  }
  
  return new APIError(error.message, null, null)
}

export default APIError
