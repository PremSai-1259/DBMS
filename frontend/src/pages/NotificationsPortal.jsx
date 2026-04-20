import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'
import { notificationService } from '../services/notificationService'

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
]

const typeMeta = {
  appointment: { label: 'Appointment', color: '#3a7bd5', bg: '#e8f0fb' },
  access: { label: 'Access', color: '#1a9e6a', bg: '#e6f9f2' },
  approval: { label: 'Approval', color: '#b07a00', bg: '#fff8e6' },
  system: { label: 'System', color: '#64748b', bg: '#f1f5f9' },
}

const formatDateTime = (value) => {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeMeta = (type) => {
  const normalized = String(type || 'system').toLowerCase()
  return typeMeta[normalized] || typeMeta.system
}

const NotificationsPortal = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [summary, setSummary] = useState({ total: 0, unread: 0 })
  const [notifications, setNotifications] = useState([])

  const dashboardRoute = useMemo(() => {
    if (user?.role === 'doctor') return '/doctor'
    if (user?.role === 'admin') return '/admin'
    return '/patient'
  }, [user?.role])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data.notifications || [])
      setSummary({ total: data.total || 0, unread: data.unread || 0 })
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((item) => !item.isRead)
    }

    if (filter === 'read') {
      return notifications.filter((item) => item.isRead)
    }

    return notifications
  }, [filter, notifications])

  const handleMarkAsRead = async (notification) => {
    if (!notification || notification.isRead || saving) return

    setSaving(true)
    try {
      await notificationService.markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      )
      setSummary((prev) => ({
        total: prev.total,
        unread: Math.max(0, prev.unread - 1),
      }))
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to mark notification as read', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (summary.unread === 0 || saving) return

    setSaving(true)
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setSummary((prev) => ({ ...prev, unread: 0 }))
      showToast('All notifications marked as read', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to mark all notifications as read', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    loadNotifications()
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
      <Toast toast={toast} />

      <div className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-8"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e6ecf5' }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(dashboardRoute)}
            className="rounded-xl border border-[#d5deea] px-4 py-2 text-sm font-medium text-[#2d5a8e] transition-all duration-200 hover:bg-[#f8f9fc]"
          >
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[#1a2a3a]">Notification Portal</h1>
            <p className="text-xs text-[#8a9ab0]">Messages created by appointments, access requests, and admin actions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-xl border border-[#d5deea] px-4 py-2 text-sm font-medium text-[#4a5a6a] transition-all duration-200 hover:bg-[#f8f9fc]"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={summary.unread === 0 || saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-24 md:px-6">
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard title="Total" value={summary.total} hint="All saved notifications" />
          <SummaryCard title="Unread" value={summary.unread} hint="Needs your attention" accent />
          <SummaryCard title="Role" value={String(user?.role || 'user').toUpperCase()} hint="Current account type" />
        </section>

        <section className="mb-5 flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => {
            const active = filter === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
                style={active
                  ? { background: '#3a7bd5', color: 'white' }
                  : { background: 'white', color: '#4a5a6a', border: '1px solid #d5deea' }}
              >
                {option.label}
              </button>
            )
          })}
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white py-20 text-center" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5]" />
            <p className="text-sm text-[#8a9ab0]">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl bg-white py-16 text-center" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
            <div className="mb-4 text-5xl">No notifications</div>
            <h2 className="text-xl font-semibold text-[#1a2a3a] mb-2">No notifications found</h2>
            <p className="text-sm text-[#8a9ab0]">
              {filter === 'unread'
                ? 'You do not have any unread notifications right now.'
                : filter === 'read'
                  ? 'No read notifications to show.'
                  : 'Your notification inbox is empty for now.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const meta = getTypeMeta(notification.type)

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkAsRead(notification)}
                  className="w-full rounded-2xl bg-white p-5 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
                  style={{
                    border: notification.isRead ? '1px solid #e6ecf5' : '1px solid #cfe0f7',
                    boxShadow: '0 4px 24px rgba(45,90,142,0.08)',
                    opacity: notification.isRead ? 0.92 : 1,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {notification.isRead ? '✓' : '•'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        {!notification.isRead && (
                          <span className="rounded-full bg-[#fff8e6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#b07a00]">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="text-[15px] font-medium text-[#1a2a3a]">{notification.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8a9ab0]">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.id && <span>ID: {notification.id}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

const SummaryCard = ({ title, value, hint, accent = false }) => {
  return (
    <div
      className="rounded-3xl bg-white p-6"
      style={{
        border: accent ? '1px solid #cfe0f7' : '1px solid #e6ecf5',
        boxShadow: '0 4px 24px rgba(45,90,142,0.08)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a9ab0]">{title}</p>
      <div className="mt-2 text-3xl font-semibold text-[#1a2a3a]">{value}</div>
      <p className="mt-2 text-sm text-[#6b7280]">{hint}</p>
    </div>
  )
}

export default NotificationsPortal
