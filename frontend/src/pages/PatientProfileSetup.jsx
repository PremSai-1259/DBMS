import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService } from '../services/profileService'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'

const PatientProfileSetup = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, showToast } = useToast()

  const [form, setForm] = useState({
    age: '',
    gender: '',
    phone: '',
    bloodGroup: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => {
    const value = k === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value
    setForm(f => ({ ...f, [k]: value }))
  }

  const inputStyle = {
    border: '1.5px solid #d0daea',
    background: '#f8f9fc',
    fontFamily: "'DM Sans', sans-serif",
  }

  const focusStyle = (e) => {
    e.target.style.borderColor = '#3a7bd5'
    e.target.style.background = 'white'
    e.target.style.boxShadow = '0 0 0 4px rgba(58,123,213,0.08)'
  }

  const blurStyle = (e) => {
    e.target.style.borderColor = '#d0daea'
    e.target.style.background = '#f8f9fc'
    e.target.style.boxShadow = 'none'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!form.age || !form.gender || !form.phone || !form.bloodGroup) {
      showToast('Please fill in all fields', 'error')
      return
    }

    if (form.age < 1 || form.age > 150) {
      showToast('Please enter a valid age', 'error')
      return
    }

    if (!/^\d{10}$/.test(form.phone)) {
      showToast('Please enter a valid 10-digit phone number', 'error')
      return
    }

    setLoading(true)
    try {
      await profileService.createProfile({
        age: parseInt(form.age),
        gender: form.gender,
        phone: form.phone,
        bloodGroup: form.bloodGroup
      })
      showToast('Profile created successfully! Redirecting...', 'success')
      setTimeout(() => navigate('/patient'), 600)
    } catch (err) {
      showToast(err.message || 'Failed to create profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
      <Toast toast={toast} />

      <div className="w-full max-w-md">
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
          
          {/* Header */}
          <div className="p-10 pb-8" style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
                style={{ background: 'rgba(255,255,255,0.15)' }}>👤</div>
              <span className="text-white text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Complete Your Profile
              </span>
            </div>
            <p className="text-white/70 text-sm">
              Help us know you better to provide personalized healthcare services.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-10 space-y-5">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={set('age')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="Enter your age"
                min="1"
                max="150"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Gender</label>
              <select
                value={form.gender}
                onChange={set('gender')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="Enter 10-digit phone number"
                maxLength="10"
                inputMode="numeric"
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Blood Group</label>
              <select
                value={form.bloodGroup}
                onChange={set('bloodGroup')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 mt-6"
              style={{
                background: loading ? '#a8c5e0' : 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </button>

            <p className="text-center text-xs text-[#8a9ab0]">
              You can update your profile information later from your dashboard.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PatientProfileSetup
