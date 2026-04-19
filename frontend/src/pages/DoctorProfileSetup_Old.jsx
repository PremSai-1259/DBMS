import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService } from '../services/profileService'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'

const DoctorProfileSetup = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, showToast } = useToast()

  const [form, setForm] = useState({
    specialization: '',
    experience: '',
    hospitalName: '',
    address: ''
  })
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showApprovalPopup, setShowApprovalPopup] = useState(false)
  const [isResubmission, setIsResubmission] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submissionStep, setSubmissionStep] = useState(0) // 0: initial, 1: uploading, 2: creating profile, 3: requesting approval

  useEffect(() => {
    checkExistingProfile()
  }, [])

  const checkExistingProfile = async () => {
    try {
      const res = await profileService.getApprovalStatus()
      if (res.data?.status === 'rejected') {
        // Pre-fill the form with existing data if available
        if (res.data.doctorProfile) {
          setForm({
            specialization: res.data.doctorProfile.specialization || '',
            experience: res.data.doctorProfile.experience || '',
            hospitalName: res.data.doctorProfile.hospitalName || '',
            address: res.data.doctorProfile.address || ''
          })
          setRejectionReason(res.data.adminMessage || '')
        }
        setIsResubmission(true)
      } else if (res.data?.status === 'pending' || res.data?.status === 'approved') {
        // Doctor already has a request in progress or approved
        navigate('/doctor-dashboard')
      }
    } catch (err) {
      // No existing profile, continue with new setup
      console.log('No existing profile found')
    } finally {
      setInitialLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

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

  const handleCertificateSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      showToast('Only PDF, JPEG, PNG files allowed', 'error')
      return
    }

    // Validate file size (10MB limit for certificates)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Certificate file must be less than 10MB', 'error')
      return
    }

    setCertificate(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Strict validation
    if (!form.specialization || form.specialization.trim().length === 0) {
      showToast('Specialization is required', 'error')
      return
    }
    
    if (form.specialization.trim().length < 3) {
      showToast('Specialization must be at least 3 characters', 'error')
      return
    }

    if (!form.experience || isNaN(parseInt(form.experience))) {
      showToast('Experience is required and must be a valid number', 'error')
      return
    }

    if (parseInt(form.experience) < 0 || parseInt(form.experience) > 70) {
      showToast('Experience must be between 0-70 years', 'error')
      return
    }

    if (!form.hospitalName || form.hospitalName.trim().length === 0) {
      showToast('Hospital/Clinic name is required', 'error')
      return
    }

    if (!form.address || form.address.trim().length === 0) {
      showToast('Address is required', 'error')
      return
    }

    if (form.address.trim().length < 10) {
      showToast('Address must be at least 10 characters', 'error')
      return
    }

    if (!certificate) {
      showToast('Please upload a certificate file', 'error')
      return
    }

    setLoading(true)
    setSubmissionStep(1)
    try {
      console.log('📋 Starting profile submission process...')
      
      // STEP 1: Upload certificate file
      console.log('1️⃣  Uploading certificate file...')
      setSubmissionStep(1)
      showToast('📤 Uploading certificate file...', 'info')
      
      const formData = new FormData()
      formData.append('file', certificate)
      formData.append('fileType', 'certificate')

      const fileRes = await profileService.uploadFile(formData)
      const certificateFileId = fileRes.data.fileId
      console.log('✅ Certificate uploaded, file ID:', certificateFileId)
      
      // STEP 2: Create/update doctor profile
      console.log('2️⃣  Creating doctor profile...')
      setSubmissionStep(2)
      showToast('📝 Creating your profile...', 'info')
      
      const profileRes = await profileService.createProfile({
        specialization: form.specialization.trim(),
        experience: parseInt(form.experience),
        hospitalName: form.hospitalName.trim(),
        address: form.address.trim(),
        certificateFileId
      })
      console.log('✅ Profile created/updated, profile ID:', profileRes.data.profileId)
      
      // STEP 3: Request approval with certificate (also handles resubmission)
      console.log('3️⃣  Requesting approval...')
      setSubmissionStep(3)
      showToast('✉️ Submitting approval request...', 'info')
      
      const approvalRes = await profileService.requestDoctorApproval(certificateFileId)
      console.log('✅ Approval requested, approval ID:', approvalRes.data.approvalId)
      
      // STEP 4: Show approval popup
      console.log('✅ All steps completed successfully!')
      setShowApprovalPopup(true)
      setSubmissionStep(0)
      setLoading(false)
    } catch (err) {
      console.error('❌ Error during profile submission:', err)
      
      // Handle specific HTTP status codes
      let errorMessage = 'Failed to complete profile setup'
      
      if (err.response?.status === 409) {
        // Conflict errors - different reasons
        const errorText = err.response.data?.error || '';
        if (errorText.includes('pending approval')) {
          errorMessage = '⏳ Your profile is already pending admin review. Please wait for approval before resubmitting.';
        } else if (errorText.includes('already approved')) {
          errorMessage = '✅ Your profile is already approved! You can go to your dashboard.';
        } else {
          errorMessage = 'Your request conflicts with existing data. Please refresh and try again.';
        }
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid form data. Please check all fields are filled correctly.'
      } else if (err.response?.status === 401) {
        errorMessage = 'You are not authenticated. Please login again.'
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      showToast(errorMessage, 'error')
      setSubmissionStep(0)
      setLoading(false)
    }
  }

  const handleApprovalConfirm = () => {
    setShowApprovalPopup(false)
    navigate('/doctor-dashboard')
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin mx-auto mb-4" />
          <p className="text-[#4a5a6a]">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eaf0fb 50%, #dce8f7 100%)' }}>
      <Toast toast={toast} />

      {/* Approval Popup */}
      {showApprovalPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full"
            style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-[#1a2a3a] mb-2">
                {isResubmission ? 'Resubmission Sent' : 'Request Sent for Approval'}
              </h3>
              <p className="text-sm text-[#8a9ab0] mb-6">
                {isResubmission 
                  ? 'Your updated profile and certificate have been resubmitted for admin review.' 
                  : 'Your doctor profile and certificate have been submitted for admin review.'}
                {' '}You'll receive an email notification once your profile is reviewed.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-medium text-[#3a7bd5] mb-2">📋 What happens next:</p>
                <ul className="text-xs text-[#4a5a6a] space-y-1">
                  <li>• Admin reviews your credentials</li>
                  <li>• Certificate verification</li>
                  <li>• Profile approval or feedback</li>
                  <li>• You'll be notified via email</li>
                </ul>
              </div>
              <button
                onClick={handleApprovalConfirm}
                className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)',
                  boxShadow: '0 4px 12px rgba(58,123,213,0.2)'
                }}
              >
                Got It, Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
          
          {/* Header */}
          <div className="p-10 pb-8" style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
                style={{ background: 'rgba(255,255,255,0.15)' }}>👨‍⚕️</div>
              <span className="text-white text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {isResubmission ? 'Update Your Profile' : 'Complete Your Profile'}
              </span>
            </div>
            <p className="text-white/70 text-sm">
              {isResubmission 
                ? 'Update your medical credentials and upload a new certificate for re-verification.' 
                : 'Add your medical credentials and upload certificate for admin verification.'}
            </p>
            {isResubmission && rejectionReason && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-400 rounded text-sm text-red-100">
                <p className="font-medium mb-1">Previous Feedback:</p>
                <p>{rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-10 space-y-5">
            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Specialization</label>
              <select
                value={form.specialization}
                onChange={set('specialization')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              >
                <option value="">Select Specialization</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="ENT">ENT</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Urology">Urology</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Years of Experience</label>
              <input
                type="number"
                value={form.experience}
                onChange={set('experience')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="Enter years of experience"
                min="0"
                max="70"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              />
            </div>

            {/* Hospital Name */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Hospital / Clinic Name</label>
              <input
                type="text"
                value={form.hospitalName}
                onChange={set('hospitalName')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="Enter hospital or clinic name"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                style={inputStyle}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Address</label>
              <textarea
                value={form.address}
                onChange={set('address')}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="Enter your clinic/hospital address"
                rows="3"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none resize-none"
                style={inputStyle}
              />
            </div>

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-[#4a5a6a] mb-2">
                Medical Certificate * {isResubmission && '(Required for resubmission)'}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleCertificateSelect}
                  accept=".pdf,.jpeg,.jpg,.png"
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="px-4 py-4 rounded-lg border-2 border-dashed border-[#d0daea] text-center hover:border-[#3a7bd5] transition-colors"
                  style={{ background: '#f8f9fc' }}>
                  <div className="text-2xl mb-1">📄</div>
                  {certificate ? (
                    <div>
                      <p className="text-sm font-medium text-[#3a7bd5]">{certificate.name}</p>
                      <p className="text-xs text-[#8a9ab0] mt-1">
                        {(certificate.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[#4a5a6a]">Click to upload certificate</p>
                      <p className="text-xs text-[#8a9ab0] mt-1">PDF, JPEG, PNG (max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
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
              {loading 
                ? (submissionStep === 1 
                  ? '📤 Uploading Certificate...'
                  : submissionStep === 2
                  ? '📝 Creating Profile...'
                  : submissionStep === 3
                  ? '✉️ Submitting Approval...'
                  : (isResubmission ? 'Resubmitting...' : 'Submitting...'))
                : (isResubmission ? 'Resubmit Profile for Approval' : 'Submit Profile for Approval')}
            </button>

            <p className="text-center text-xs text-[#8a9ab0]">
              Your certificate will be verified by our admin team before approval.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfileSetup
