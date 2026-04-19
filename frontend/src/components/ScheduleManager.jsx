import { useEffect, useState } from 'react'
import { scheduleService } from '../services/scheduleService'
import useToast from '../hooks/useToast'

const parseLocalDate = (dateString) => {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const ScheduleManager = ({ selectedDate }) => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localChanges, setLocalChanges] = useState({})
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const { showToast } = useToast()

  const generateFallbackSlots = () => {
    const slotTimes = [
      { slot: 1, start: '08:00', end: '08:30' },
      { slot: 2, start: '08:30', end: '09:00' },
      { slot: 3, start: '09:00', end: '09:30' },
      { slot: 4, start: '09:30', end: '10:00' },
      { slot: 5, start: '10:00', end: '10:30' },
      { slot: 6, start: '10:30', end: '11:00' },
      { slot: 7, start: '11:00', end: '11:30' },
      { slot: 8, start: '11:30', end: '12:00' },
      { slot: 11, start: '13:00', end: '13:30' },
      { slot: 12, start: '13:30', end: '14:00' },
      { slot: 13, start: '14:00', end: '14:30' },
      { slot: 14, start: '14:30', end: '15:00' },
      { slot: 15, start: '15:00', end: '15:30' },
      { slot: 16, start: '15:30', end: '16:00' },
      { slot: 17, start: '16:00', end: '16:30' },
      { slot: 18, start: '16:30', end: '17:00' },
      { slot: 19, start: '17:00', end: '17:30' },
      { slot: 20, start: '17:30', end: '18:00' },
      { slot: 21, start: '18:00', end: '18:30' },
      { slot: 22, start: '18:30', end: '19:00' },
      { slot: 23, start: '19:00', end: '19:30' },
      { slot: 24, start: '19:30', end: '20:00' },
    ]

    const convertTo12Hour = (time24) => {
      const [hours, minutes] = time24.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
    }

    return slotTimes.map((slot) => ({
      slotNumber: slot.slot,
      startTime: slot.start,
      endTime: slot.end,
      displayTime: `${convertTo12Hour(slot.start)} - ${convertTo12Hour(slot.end)}`,
      isAvailable: false,
      isBooked: false,
    }))
  }

  const loadSlots = async () => {
    setLoading(true)
    setIsUsingFallback(false)
    try {
      const response = await scheduleService.getSlotsForDate(selectedDate)
      const loadedSlots = response?.data?.slots || []

      if (!Array.isArray(loadedSlots) || loadedSlots.length === 0) {
        setSlots(generateFallbackSlots())
        setIsUsingFallback(true)
      } else {
        setSlots(loadedSlots)
      }

      setLocalChanges({})
    } catch (error) {
      console.error('Failed to load slots:', error)
      setSlots(generateFallbackSlots())
      setIsUsingFallback(true)
      showToast('Using default schedule (API error - changes will be saved locally)', 'warning')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
  }, [selectedDate])

  const handleToggleSlot = (slotNumber) => {
    const slot = slots.find((s) => s.slotNumber === slotNumber)
    if (!slot) return

    const newStatus = !slot.isAvailable
    setSlots((prev) => prev.map((s) => (s.slotNumber === slotNumber ? { ...s, isAvailable: newStatus } : s)))
    setLocalChanges((prev) => ({ ...prev, [slotNumber]: newStatus }))
  }

  const handleSelectAll = () => {
    const changes = {}
    setSlots((prev) =>
      prev.map((slot) => {
        changes[slot.slotNumber] = true
        return { ...slot, isAvailable: true }
      })
    )
    setLocalChanges(changes)
  }

  const handleDeselectAll = () => {
    const changes = {}
    setSlots((prev) =>
      prev.map((slot) => {
        changes[slot.slotNumber] = false
        return { ...slot, isAvailable: false }
      })
    )
    setLocalChanges(changes)
  }

  const handleSaveChanges = async () => {
    if (Object.keys(localChanges).length === 0) {
      showToast('No changes to save', 'warning')
      return
    }

    const availableSlots = slots.filter((slot) => slot.isAvailable)
    if (availableSlots.length === 0) {
      showToast('Please set at least one slot as available before saving', 'warning')
      return
    }

    setSaving(true)
    try {
      const slotsToSave = {}
      availableSlots.forEach((slot) => {
        slotsToSave[slot.slotNumber] = true
      })

      await scheduleService.updateMultipleSlots(selectedDate, slotsToSave)
      setLocalChanges({})
      setIsUsingFallback(false)
      showToast(`Schedule saved. ${availableSlots.length} slot(s) available.`, 'success')
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error.message || 'Unknown error'
      showToast('Failed to save schedule: ' + errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const isSlotExpired = (slotStartTime) => {
    const now = new Date()
    const selectedDateTime = parseLocalDate(selectedDate)
    if (!selectedDateTime) return false

    if (selectedDateTime < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return true
    }

    if (selectedDateTime.toDateString() === now.toDateString()) {
      const [hours, minutes] = slotStartTime.split(':').map(Number)
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      return slotTime < now
    }

    return false
  }

  const getSlotStyle = (slot) => {
    const isExpired = isSlotExpired(slot.startTime)

    if (isExpired) {
      return {
        background: '#d1d5db',
        borderColor: '#9ca3af',
        textColor: '#6b7280',
        badgeBg: '#e5e7eb',
        badgeText: '#6b7280',
        badge: 'Past',
        isDisabled: false,
      }
    }

    if (slot.isBooked) {
      return {
        background: 'linear-gradient(135deg, #fed7aa, #fdba74)',
        borderColor: '#f97316',
        textColor: '#1a2a3a',
        badgeBg: '#fed7aa',
        badgeText: '#b45309',
        badge: 'Booked',
        isDisabled: false,
      }
    }

    if (slot.isAvailable) {
      return {
        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
        borderColor: '#16a34a',
        textColor: '#1a2a3a',
        badgeBg: '#dcfce7',
        badgeText: '#166534',
        badge: 'Open',
        isDisabled: false,
      }
    }

    return {
      background: '#ffffff',
      borderColor: '#e5e7eb',
      textColor: '#1a2a3a',
      badgeBg: '#f3f4f6',
      badgeText: '#6b7280',
      badge: 'Off',
      isDisabled: false,
    }
  }

  const availableCount = slots.filter((s) => s.isAvailable).length
  const changedCount = Object.keys(localChanges).length
  const morningSlots = slots.filter((s) => s.slotNumber <= 8)
  const afternoonSlots = slots.filter((s) => s.slotNumber >= 11)
  const hasAvailableSlots = slots.some((s) => s.isAvailable)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1a2a3a]">Loading your schedule...</p>
          <p className="mt-1 text-xs text-[#8a9ab0]">Please wait a moment</p>
        </div>
      </div>
    )
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-2xl border-2 bg-gradient-to-r from-[#fee2e2] to-[#fca5a5] px-6 py-5" style={{ borderColor: '#dc2626' }}>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#991b1b]">Unable to Load Schedule</h4>
              <p className="mt-1.5 text-xs text-[#b91c1c]">The schedule data could not be loaded. This might be a temporary issue.</p>
              <button
                onClick={loadSlots}
                className="mt-3 rounded-lg bg-[#dc2626] px-4 py-2 text-xs font-bold text-white transition-all transform hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {isUsingFallback && (
        <div className="rounded-2xl border-2 bg-[#fef3c7] px-6 py-5" style={{ borderColor: '#fcd34d' }}>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#92400e]">Temporary Connection Mode</h4>
              <p className="mt-1.5 text-xs text-[#a16207]">
                There is a temporary issue connecting to the server. Using the default schedule view.
              </p>
              <button
                onClick={loadSlots}
                className="mt-3 rounded-lg bg-[#f59e0b] px-4 py-2 text-xs font-bold text-white transition-all transform hover:scale-105 active:scale-95"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#f8f9fc] to-[#f0f4f9] rounded-2xl border border-[#e6ecf5] p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1a2a3a] flex items-center gap-2">
              <span className="text-xl">Schedule Overview</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="rounded-lg border border-[#1a9e6a] bg-[#e6f9f2] px-3 py-1.5 text-xs font-semibold text-[#1a9e6a] transition-all transform hover:scale-105"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="rounded-lg border border-[#dc2626] bg-[#fee2e2] px-3 py-1.5 text-xs font-semibold text-[#dc2626] transition-all transform hover:scale-105"
              >
                Deselect All
              </button>
            </div>
          </div>
          <p className="text-xs text-[#8a9ab0]">
            Click on any slot to toggle availability. Green = Available, Orange = Booked, Grey = Completed/Past
          </p>
        </div>

        <div className="mb-8">
          <div className="mb-4 border-b-2 border-[#e6ecf5] pb-3">
            <h4 className="text-sm font-bold text-[#1a2a3a]">Morning (8:00 AM - 12:00 PM)</h4>
            <p className="mt-1 text-xs text-[#8a9ab0]">{morningSlots.filter((s) => s.isAvailable).length} / {morningSlots.length} slots available</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {morningSlots.map((slot) => {
              const slotStyle = getSlotStyle(slot)
              return (
                <button
                  key={slot.slotNumber}
                  onClick={() => !slotStyle.isDisabled && handleToggleSlot(slot.slotNumber)}
                  disabled={slotStyle.isDisabled}
                  className="relative rounded-xl border-2 p-4 transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: slotStyle.background,
                    borderColor: slotStyle.borderColor,
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: slotStyle.textColor }}>
                      {slot.slotNumber}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-[#3a7bd5]">{slot.displayTime}</div>
                    <div className="mt-3 inline-block rounded-full px-2 py-1 text-xs font-bold" style={{ background: slotStyle.badgeBg, color: slotStyle.badgeText }}>
                      {slotStyle.badge}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-8 rounded-xl border-2 border-[#fcd34d] bg-[#fef3c7] px-5 py-4">
          <p className="text-sm font-bold text-[#92400e]">Lunch Break</p>
          <p className="mt-0.5 text-xs text-[#a16207]">12:00 PM - 1:00 PM (Slots 9-10 are always unavailable)</p>
        </div>

        <div>
          <div className="mb-4 border-b-2 border-[#e6ecf5] pb-3">
            <h4 className="text-sm font-bold text-[#1a2a3a]">Afternoon & Evening (1:00 PM - 9:00 PM)</h4>
            <p className="mt-1 text-xs text-[#8a9ab0]">{afternoonSlots.filter((s) => s.isAvailable).length} / {afternoonSlots.length} slots available</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {afternoonSlots.map((slot) => {
              const slotStyle = getSlotStyle(slot)
              return (
                <button
                  key={slot.slotNumber}
                  onClick={() => !slotStyle.isDisabled && handleToggleSlot(slot.slotNumber)}
                  disabled={slotStyle.isDisabled}
                  className="relative rounded-xl border-2 p-4 transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: slotStyle.background,
                    borderColor: slotStyle.borderColor,
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: slotStyle.textColor }}>
                      {slot.slotNumber}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-[#3a7bd5]">{slot.displayTime}</div>
                    <div className="mt-3 inline-block rounded-full px-2 py-1 text-xs font-bold" style={{ background: slotStyle.badgeBg, color: slotStyle.badgeText }}>
                      {slotStyle.badge}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {changedCount > 0 ? (
        <div className="rounded-2xl border-2 border-[#10b981] bg-gradient-to-r from-[#ecfdf5] to-[#d1fae5] p-6 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-[#065f46]">
                You have {changedCount} unsaved change{changedCount > 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-xs text-[#047857]">
                {!hasAvailableSlots
                  ? 'Select at least one slot to save'
                  : `Ready to save ${availableCount} available slot${availableCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveChanges}
                disabled={saving || !hasAvailableSlots}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                style={{
                  background: hasAvailableSlots ? 'linear-gradient(135deg, #10b981, #059669)' : '#9ca3af',
                }}
              >
                {saving ? 'Saving...' : `Save Changes (${changedCount})`}
              </button>
              <button
                onClick={loadSlots}
                disabled={saving}
                className="rounded-xl border-2 border-[#e5e7eb] bg-white px-5 py-3 text-sm font-semibold text-[#4b5563] transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-[#0ea5e9] bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe] p-6 text-center">
          <p className="text-sm font-semibold text-[#0369a1]">Your schedule is all set!</p>
          <p className="mt-1 text-xs text-[#0c4a6e]">Make changes to update your availability</p>
        </div>
      )}
    </div>
  )
}

export default ScheduleManager
