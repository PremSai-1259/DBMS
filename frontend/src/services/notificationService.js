import api from './api'

const sortNewestFirst = (items) => {
  return [...items].sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return right - left
  })
}

const normalizeNotification = (notification) => ({
  ...notification,
  isRead: Boolean(notification.isRead ?? notification.is_read),
  createdAt: notification.createdAt || notification.created_at || null,
})

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications')
    const notifications = Array.isArray(response.data?.notifications)
      ? response.data.notifications.map(normalizeNotification)
      : []

    return {
      total: response.data?.total ?? notifications.length,
      unread: response.data?.unread ?? notifications.filter((item) => !item.isRead).length,
      notifications: sortNewestFirst(notifications),
    }
  },

  markAsRead: async (notificationId) => {
    if (!notificationId) {
      throw new Error('Notification ID is required')
    }

    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all')
    return response.data
  },
}

export default notificationService
