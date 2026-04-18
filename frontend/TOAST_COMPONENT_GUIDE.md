# Toast Component - Usage Guide

## Overview

The Toast component displays temporary notifications for success, error, warning, and info messages. It's built with React hooks and features auto-dismiss, manual close, and smooth animations.

## Files

- **Component**: `src/components/Toast.jsx`
- **Styles**: `src/styles/components/Toast.css`
- **Hook**: `src/hooks/useToast.js`

## Features

✅ Multiple types: success, error, warning, info
✅ Auto-dismiss after configurable duration
✅ Manual close button
✅ Smooth slide-in/out animations
✅ Reusable Toast component
✅ Custom useToast hook for easy state management
✅ Multiple toasts can stack
✅ Responsive design (mobile-friendly)
✅ Accessibility: aria-live, aria-label, focus styles

## Component Usage

### Basic Usage

```jsx
import Toast from '../components/Toast'
import { useState } from 'react'

function MyComponent() {
  const [showToast, setShowToast] = useState(false)

  return (
    <>
      <button onClick={() => setShowToast(true)}>Show Toast</button>
      <Toast
        message="Success! Operation completed."
        type="success"
        duration={3000}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | - | Toast message text (required) |
| `type` | string | 'info' | Type: 'success', 'error', 'warning', 'info' |
| `duration` | number | 3000 | Auto-dismiss time in ms (0 = never auto-dismiss) |
| `onClose` | function | - | Callback when toast closes |
| `isVisible` | boolean | true | Controls visibility |

### Types

```jsx
// Success - Green background
<Toast message="Appointment booked successfully!" type="success" />

// Error - Red background
<Toast message="Failed to book appointment. Please try again." type="error" />

// Warning - Yellow background
<Toast message="Please confirm your appointment details." type="warning" />

// Info - Blue background
<Toast message="Your appointment is confirmed." type="info" />
```

## useToast Hook Usage (Recommended)

The `useToast` hook makes managing toasts much easier. It handles all state and provides convenience methods.

### Basic Setup

```jsx
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'

function PatientDashboard() {
  const { toasts, addToast, success, error } = useToast()

  const handleBookAppointment = async () => {
    try {
      // Book appointment
      await appointmentService.bookAppointment(data)

      // Show success toast
      success('Appointment booked successfully!')
    } catch (err) {
      // Show error toast
      error('Failed to book appointment. Please try again.')
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
      <button onClick={handleBookAppointment}>Book Appointment</button>
    </>
  )
}
```

### Hook Methods

#### `addToast(options)`
Add a custom toast notification.

```jsx
const { addToast } = useToast()

addToast({
  message: 'Custom message',
  type: 'success',
  duration: 3000,
  onClose: () => console.log('Toast closed')
})
```

#### `success(message, duration?)`
Show success toast (default duration: 3000ms).

```jsx
const { success } = useToast()

success('Operation successful!')
success('Appointment booked!', 2000) // Custom duration
```

#### `error(message, duration?)`
Show error toast (default duration: 4000ms).

```jsx
const { error } = useToast()

error('Something went wrong!')
error('Invalid email address', 3000)
```

#### `warning(message, duration?)`
Show warning toast (default duration: 3500ms).

```jsx
const { warning } = useToast()

warning('Please confirm your action')
```

#### `info(message, duration?)`
Show info toast (default duration: 3000ms).

```jsx
const { info } = useToast()

info('Your profile has been updated')
```

#### `removeToast(id)`
Remove a specific toast.

```jsx
const { removeToast } = useToast()

const toastId = addToast({ message: 'Test' })
removeToast(toastId)
```

#### `clearToasts()`
Remove all toasts.

```jsx
const { clearToasts } = useToast()

clearToasts()
```

## Complete Example - PatientDashboard Integration

Here's how to use Toast in the PatientDashboard component:

```jsx
import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { appointmentService, doctorService } from '../services'
import BookingModal from '../components/BookingModal'

function PatientDashboard() {
  const { toasts, success, error, warning } = useToast()
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await doctorService.getAllDoctorsWithSlots()
        setDoctors(data)
      } catch (err) {
        error('Failed to load doctors. Please refresh the page.')
      }
    }
    fetchDoctors()
  }, [error])

  // Handle booking appointment
  const handleBookAppointment = async (slotId) => {
    if (!selectedDoctor) {
      warning('Please select a doctor first')
      return
    }

    try {
      setLoading(true)

      const result = await appointmentService.bookAppointment({
        slotId,
        doctorId: selectedDoctor.doctorId,
      })

      // Success!
      success(`Appointment booked with ${selectedDoctor.name}!`)

      // Refresh appointments
      const updatedAppointments = await appointmentService.getAppointments()
      setAppointments(updatedAppointments)

      // Close modal
      setShowBookingModal(false)
      setSelectedDoctor(null)
      setSelectedSlot(null)
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'This slot is no longer available. Please choose another.'
          : 'Failed to book appointment. Please try again.'

      error(message)
    } finally {
      setLoading(false)
    }
  }

  // Handle cancel appointment
  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentService.cancelAppointment(appointmentId, 'Patient requested')
      success('Appointment cancelled successfully')

      // Refresh appointments
      const updatedAppointments = await appointmentService.getAppointments()
      setAppointments(updatedAppointments)
    } catch (err) {
      error('Failed to cancel appointment. Please try again.')
    }
  }

  return (
    <div className="patient-dashboard">
      {/* Toast Container - displays all toasts */}
      <ToastContainer toasts={toasts} />

      {/* Your dashboard content */}
      <div className="content">
        {/* Doctor Search */}
        <section className="doctor-search">
          <h2>Available Doctors</h2>
          {/* Doctor list and search UI */}
        </section>

        {/* Appointments */}
        <section className="appointments">
          <h2>My Appointments</h2>
          {/* Appointments list with cancel buttons */}
          {appointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <h3>{apt.doctorName}</h3>
              <p>{apt.date} at {apt.time}</p>
              <button onClick={() => handleCancelAppointment(apt.id)}>
                Cancel
              </button>
            </div>
          ))}
        </section>

        {/* Booking Modal */}
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedDoctor(null)
          }}
          onSuccess={handleBookAppointment}
          isOpen={showBookingModal}
        />
      </div>
    </div>
  )
}

export default PatientDashboard
```

## Styling

### Colors

- **Success**: Green (#28a745)
- **Error**: Red (#dc3545)
- **Warning**: Yellow (#ffc107)
- **Info**: Blue (#17a2b8)

### Customization

To customize colors, edit `src/styles/components/Toast.css`:

```css
/* Example: Make success toasts darker green */
.toast-success {
  background-color: #c3e6cb;
  color: #1e5631;
  border-left-color: #1e5631;
}
```

## Positioning

Toasts appear in the **top-right** corner by default. To change position, modify `.toast-container` in CSS:

```css
/* Top-left */
.toast-container {
  top: 20px;
  right: auto;
  left: 20px;
}

/* Bottom-right */
.toast-container {
  top: auto;
  bottom: 20px;
  right: 20px;
}
```

## Animations

### Duration
- **Slide-in**: 300ms (smooth entry)
- **Auto-dismiss**: Configurable (default 3000ms)
- **Slide-out**: 300ms (smooth exit)

### Customization
To change animation speed, edit `.toast` and `@keyframes slideIn` in CSS:

```css
.toast {
  animation: slideIn 0.5s ease-out; /* Slower slide-in */
}

@keyframes slideIn {
  from {
    transform: translateX(600px); /* Slide from further right */
  }
}
```

## Accessibility

✅ **aria-live**: Announces toast to screen readers
✅ **aria-label**: Labels close button
✅ **focus-visible**: Shows focus outline on close button
✅ **Semantic**: Uses button element for interactive close

## Best Practices

1. **Use appropriate type**: success, error, warning, info
2. **Keep messages concise**: Under 80 characters
3. **Use hook for easier state**: useToast is recommended
4. **Toast for non-blocking actions**: Don't replace modals for critical actions
5. **Provide clear messages**: Tell user what happened
6. **Use durations wisely**: Errors 4000ms, success 3000ms, warnings 3500ms

## Common Patterns

### Success After Action
```jsx
const { success } = useToast()

const handleSave = async () => {
  await api.post('/save', data)
  success('Changes saved successfully!')
}
```

### Error with Retry
```jsx
const { error } = useToast()

const handleDelete = async () => {
  try {
    await api.delete('/item/123')
  } catch (err) {
    error('Failed to delete. Please try again.')
  }
}
```

### Multiple Toasts
```jsx
const { success, warning, error } = useToast()

const handleMultipleActions = async () => {
  success('Step 1 complete')
  warning('Step 2 requires review')
  error('Step 3 failed')
}
```

### Clearing Previous Toast
```jsx
const { toasts, clearToasts, success } = useToast()

const handleReset = () => {
  clearToasts()
  success('Reset complete!')
}
```

## Testing

### Manual Testing
1. Click buttons to trigger toasts
2. Verify correct type and styling
3. Check auto-dismiss timing
4. Test manual close button
5. Test multiple toasts stacking
6. Test on mobile (responsive layout)

### Unit Testing Example
```jsx
import { render, screen } from '@testing-library/react'
import Toast from '../components/Toast'

test('renders success toast', () => {
  render(<Toast message="Success!" type="success" isVisible={true} />)
  expect(screen.getByText('Success!')).toBeInTheDocument()
})

test('auto-dismisses after duration', async () => {
  const { rerender } = render(
    <Toast message="Disappear" type="success" duration={100} isVisible={true} />
  )
  
  // Wait for auto-dismiss
  await new Promise(resolve => setTimeout(resolve, 150))
  
  rerender(<Toast message="Disappear" type="success" duration={100} isVisible={false} />)
  expect(screen.queryByText('Disappear')).not.toBeInTheDocument()
})
```

## Browser Support

✅ Chrome/Edge 88+
✅ Firefox 85+
✅ Safari 14+
✅ Mobile browsers

CSS animations and flexbox have excellent support across modern browsers.

## Troubleshooting

### Toast not showing
- Check `isVisible` prop is `true`
- Verify component is rendered
- Check browser console for errors

### Multiple toasts not stacking
- Use `ToastContainer` with array of toasts
- Ensure each toast has unique ID

### Toast not auto-dismissing
- Check `duration` is > 0
- Verify no errors in console
- Check `onClose` callback is defined

### Styling not applied
- Verify CSS file is imported
- Check class names match exactly
- Clear browser cache

## Future Enhancements

- [ ] Position prop (top, bottom, left, right)
- [ ] Animation variants
- [ ] Action button in toast
- [ ] Toast queue management
- [ ] Sound notifications
- [ ] Toast history/replay
