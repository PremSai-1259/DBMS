import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookAppointment } from '../services/appointmentService'
import useToast from '../hooks/useToast'
import Toast from './Toast'

const BookingModal = ({ doctor, onClose, onBooked }) => {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const { toast, showToast } = useToast()
  const navigate = useNavigate()

  if (!doctor) return null

  // Fetch available slots for this doctor
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setSlotsLoading(true)
        console.log('🔵 [BookingModal] Fetching slots for doctor:', doctor.doctorId)
        
        // Fetch slots for this specific doctor
        const response = await fetch(`http://localhost:5000/api/slots/doctor/${doctor.doctorId}`)
        const fetchedSlots = await response.json()
        
        console.log('🟢 [BookingModal] Fetched slots:', fetchedSlots)
        
        // Get current date and time
        const now = new Date()
        const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
        const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS
        
        // Format and filter slots - only include future slots
        const formattedSlots = (fetchedSlots || [])
          .map(slot => {
            // Parse slot date
            const slotDate = slot.slotDate instanceof Date 
              ? slot.slotDate.toISOString().split('T')[0]
              : slot.slotDate
            
            // Format date for display (e.g., "Apr 19, 2026")
            const dateObj = new Date(slotDate + 'T00:00:00Z')
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
            
            return {
              slotId: slot.id,
              time: `${slot.slotStartTime} - ${slot.slotEndTime}`,
              date: slotDate,
              displayDate: formattedDate,
              fullSlot: slot,
              isExpired: slotDate < currentDate || 
                        (slotDate === currentDate && slot.slotStartTime <= currentTime)
            }
          })
          .filter(slot => !slot.isExpired) // Remove expired slots
        
        console.log(`🟢 [BookingModal] Formatted ${formattedSlots.length} future slots for doctor ${doctor.doctorId}`)
        setSlots(formattedSlots)
      } catch (err) {
        console.error('🔴 [BookingModal] Error fetching slots:', err)
        showToast('Failed to load available slots', 'error')
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }

    fetchSlots()
  }, [doctor.doctorId, showToast])

  const handleConfirm = async () => {
    if (!selectedSlot) {
      showToast('Please select a time slot first', 'warning')
      return
    }
    setLoading(true)
    try {
      await bookAppointment({ slotId: selectedSlot.slotId, doctorId: doctor.doctorId })
      showToast(`Booked with ${doctor.name}!`, 'success')
      setTimeout(() => {
        onBooked?.()
        onClose()
      }, 800)
    } catch (err) {
      if (err.message?.includes('Patient profile must be created first')) {
        showToast('Please complete your patient profile before booking an appointment', 'warning')
        setTimeout(() => {
          onClose()
          navigate('/patient-profile-setup')
        }, 700)
        return
      }

      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const EMOJI_MAP = { Cardiologist: '👨‍⚕️', Neurologist: '👩‍⚕️', 'Orthopedic Surgeon': '🧑‍⚕️', Endocrinologist: '👩‍⚕️', Dermatologist: '👨‍⚕️', Pulmonologist: '👩‍⚕️' }
  const emoji = EMOJI_MAP[doctor.specialization] || '👨‍⚕️'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 40, 80, 0.4)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <Toast toast={toast} />

      <div className="bg-white rounded-3xl p-9 w-full max-w-md"
        style={{ boxShadow: '0 30px 80px rgba(20, 40, 80, 0.2)', animation: 'slideUp 0.3s ease' }}>
        
        <h3 className="text-2xl font-semibold text-text-dark mb-1.5">Book Appointment</h3>
        <p className="text-sm text-text-light mb-6">Select an available slot</p>

        {/* Doctor info */}
        <div className="flex items-center gap-4 p-4 rounded-xl mb-6 bg-off-white border border-frost">
          <div className="text-4xl flex-shrink-0">{emoji}</div>
          <div>
            <div className="font-semibold text-base text-text-dark">{doctor.name}</div>
            <div className="text-xs text-accent font-medium">{doctor.specialization}</div>
            <div className="text-xs text-text-light">🏥 {doctor.hospitalName}</div>
          </div>
        </div>

        <div className="text-xs font-bold text-text-mid uppercase tracking-wider mb-3">Choose a Time Slot</div>

        {slotsLoading ? (
          <div className="flex justify-center py-6 mb-6">
            <div className="w-6 h-6 rounded-full border-2 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {slots.map((slot) => (
              <button key={slot.slotId}
                onClick={() => setSelectedSlot(slot)}
                className="py-3 px-2 rounded-xl text-xs font-medium transition-all duration-200 text-center border-1.5 flex flex-col items-center justify-center"
                style={selectedSlot?.slotId === slot.slotId
                  ? { 
                      background: '#2ecc8a', 
                      color: 'white', 
                      border: '1.5px solid #2ecc8a',
                      boxShadow: '0 4px 12px rgba(46, 204, 138, 0.3)',
                      transform: 'scale(1.03)'
                    }
                  : { 
                      background: 'var(--green-light)', 
                      color: '#1a9e6a', 
                      border: '1.5px solid rgba(46, 204, 138, 0.2)'
                    }}>
                <div className="text-xs font-semibold">{slot.time}</div>
                <div className="text-xs opacity-75 mt-0.5">{slot.displayDate}</div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-light text-center py-6 mb-6">No available slots</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-text-mid transition-all duration-200 hover:bg-frost"
            style={{ border: '1.5px solid silver', background: 'white' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading || !selectedSlot}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 4px 14px rgba(58,123,213,0.3)' }}>
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingModal
