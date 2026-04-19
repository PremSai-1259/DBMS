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

  // Form State
  const [form, setForm] = useState({
    specialization: '',
    experience: '',
    hospitalName: '',
    address: ''
  })
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Workflow State
  const [currentStep, setCurrentStep] = useState(1) // 1: Profile, 2: Certificate, 3: Complete
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [showApprovalPopup, setShowApprovalPopup] = useState(false)
  
  // Resubmission State
  const [isResubmission, setIsResubmission] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

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
        setCurrentStep(1) // Start from profile step
      } else if (res.data?.status === 'pending') {
        // Profile exists, pending approval - go to certificate upload
        setCurrentStep(2)
        showToast('Your profile is pending verification. Now upload your certificate.', 'info')
      } else if (res.data?.status === 'approved') {
        // Already approved
        navigate('/doctor-dashboard')
      }
      setInitialLoading(false)
    } catch (err) {
      console.error('Error checking profile:', err)
      setInitialLoading(false)
    }
  }

  // Step 1: Create Doctor Profile (without file upload)
  const handleCreateProfile = async (e) => {
    e.preventDefault()

    // Validation
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

    setLoading(true)
    try {
      console.log('📝 Creating doctor profile...')
      showToast('Creating your profile...', 'info')

      await profileService.createProfile({
        specialization: form.specialization.trim(),
        experience: parseInt(form.experience),
        hospitalName: form.hospitalName.trim(),
        address: form.address.trim()
      })

      console.log('✅ Profile created successfully!')
      showToast('✅ Profile created successfully! Now upload your certificate.', 'success')
      
      // Move to certificate upload step
      setCurrentStep(2)
      setLoading(false)
    } catch (err) {
      console.error('❌ Error creating profile:', err)
      let errorMessage = 'Failed to create profile'
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid profile data'
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  // Step 2: Upload Certificate & Request Approval
  const handleCertificateSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!validTypes.includes(file.type)) {
      showToast('Only PDF, JPEG, and PNG files are allowed', 'error')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error')
      return
    }

    setCertificate(file)
    showToast(`Certificate selected: ${file.name}`, 'success')
  }

  const handleUploadCertificate = async (e) => {
    e.preventDefault()

    if (!certificate) {
      showToast('Please upload a certificate file', 'error')
      return
    }

    setLoading(true)
    try {
      console.log('📋 Starting certificate upload...')
      showToast('📤 Uploading certificate file...', 'info')

      // Upload certificate
      const formData = new FormData()
      formData.append('file', certificate)
      formData.append('fileType', 'certificate')

      const fileRes = await profileService.uploadFile(formData)
      const certificateFileId = fileRes.data.fileId
      console.log('✅ Certificate uploaded, file ID:', certificateFileId)

      // Request approval
      console.log('✉️ Requesting approval...')
      showToast('✉️ Submitting approval request...', 'info')

      try {
        const approvalRes = await profileService.requestDoctorApproval(certificateFileId)
        console.log('✅ Approval request submitted!', approvalRes.data)
      } catch (approvalErr) {
        console.error('❌ Error in approval request:', approvalErr)
        
        // Check if this is a 409 conflict (already pending/approved)
        if (approvalErr.response?.status === 409) {
          const errorText = approvalErr.response.data?.error || ''
          if (errorText.includes('pending')) {
            // Already pending - this is OK, show success anyway
            showToast('✅ Your certificate has been submitted! Your profile is now pending admin review.', 'success')
            setShowApprovalPopup(true)
            setCurrentStep(3)
            setLoading(false)
            return
          } else if (errorText.includes('approved')) {
            // Already approved
            showToast('✅ Your profile is already approved!', 'success')
            setLoading(false)
            setTimeout(() => navigate('/doctor-dashboard'), 1000)
            return
          }
        }
        
        // For other errors, throw to be caught by outer catch
        throw approvalErr
      }

      // Show success popup
      showToast('✅ Certificate uploaded and approval request sent!', 'success')
      setShowApprovalPopup(true)
      setCurrentStep(3)
      setLoading(false)
    } catch (err) {
      console.error('❌ Error uploading certificate:', err)
      
      let errorMessage = 'Failed to upload certificate'
      
      if (err.response?.status === 409) {
        const errorText = err.response.data?.error || ''
        if (errorText.includes('pending approval')) {
          errorMessage = '⏳ Your profile is already pending admin review. Please wait for approval.'
        } else if (errorText.includes('already approved')) {
          errorMessage = '✅ Your profile is already approved!'
        }
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid request. Please check your profile is complete.'
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Your certificate may have been saved. Please refresh and check your status.'
      }
      
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  const handleApprovalConfirm = () => {
    setShowApprovalPopup(false)
    setCertificate(null) // Clear certificate for next upload if needed
    navigate('/doctor-dashboard')
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#3a7bd5] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#4a5a6a]">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const focusStyle = { borderColor: '#3a7bd5', boxShadow: '0 0 0 3px rgba(58,123,213,0.1)' }
  const blurStyle = { borderColor: '#d0daea', boxShadow: 'none' }
  const inputStyle = {
    borderColor: '#d0daea',
    borderWidth: '2px',
    background: '#f8f9fc',
    color: '#2d5a8e'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eff4fb 100%)' }}>
      <Toast {...toast} />

      {/* Approval Success Popup */}
      {showApprovalPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm shadow-xl"
            style={{ boxShadow: '0 20px 60px rgba(45,90,142,0.2)' }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: 'rgba(58,123,213,0.1)' }}>✅</div>
              <h3 className="text-xl font-semibold text-[#2d5a8e] mb-2">
                Request Sent for Approval!
              </h3>
              <p className="text-[#4a5a6a] text-sm mb-6">
                Your certificate has been uploaded and your approval request has been sent to the admin team. They will review your credentials and contact you within 24-48 hours.
              </p>
              <div className="space-y-2 text-xs text-[#4a5a6a] mb-6 text-left">
                <p>✓ Profile submitted</p>
                <p>✓ Certificate uploaded</p>
                <p>✓ Approval request sent</p>
              </div>
              <button
                onClick={handleApprovalConfirm}
                className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)',
                  boxShadow: '0 4px 12px rgba(58,123,213,0.2)'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step
                    ? 'bg-[#3a7bd5] text-white'
                    : 'bg-[#d0daea] text-[#8a9ab0]'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`h-1 w-12 mx-2 transition-all ${
                    currentStep > step ? 'bg-[#3a7bd5]' : 'bg-[#d0daea]'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="mb-8 flex justify-between text-sm text-[#4a5a6a]">
          <span className={currentStep >= 1 ? 'font-semibold text-[#3a7bd5]' : ''}>Profile</span>
          <span className={currentStep >= 2 ? 'font-semibold text-[#3a7bd5]' : ''}>Certificate</span>
          <span className={currentStep >= 3 ? 'font-semibold text-[#3a7bd5]' : ''}>Complete</span>
        </div>

        {/* STEP 1: Profile Form */}
        {currentStep === 1 && (
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
            
            {/* Header */}
            <div className="p-10 pb-8" style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>👨‍⚕️</div>
                <span className="text-white text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Create Your Profile
                </span>
              </div>
              <p className="text-white/70 text-sm">
                {isResubmission 
                  ? 'Update your profile with the corrections mentioned in the rejection feedback.'
                  : 'Enter your medical credentials and professional details.'}
              </p>
              {isResubmission && rejectionReason && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-400 rounded text-sm text-red-100">
                  <p className="font-medium mb-1">Previous Feedback:</p>
                  <p>{rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProfile} className="p-10 space-y-5">
              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Specialization *</label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  onFocus={(e) => e.target.style.borderColor = focusStyle.borderColor}
                  onBlur={(e) => e.target.style.borderColor = blurStyle.borderColor}
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
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Years of Experience *</label>
                <input
                  type="number"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  onFocus={(e) => e.target.style.borderColor = focusStyle.borderColor}
                  onBlur={(e) => e.target.style.borderColor = blurStyle.borderColor}
                  min="0"
                  max="70"
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                  style={inputStyle}
                  placeholder="0-70"
                />
              </div>

              {/* Hospital Name */}
              <div>
                <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Hospital/Clinic Name *</label>
                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                  onFocus={(e) => e.target.style.borderColor = focusStyle.borderColor}
                  onBlur={(e) => e.target.style.borderColor = blurStyle.borderColor}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none"
                  style={inputStyle}
                  placeholder="Name of hospital or clinic"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-[#4a5a6a] mb-2">Professional Address *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  onFocus={(e) => e.target.style.borderColor = focusStyle.borderColor}
                  onBlur={(e) => e.target.style.borderColor = blurStyle.borderColor}
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none resize-none"
                  style={inputStyle}
                  placeholder="Full professional address (min 10 characters)"
                />
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
                {loading ? 'Creating Profile...' : 'Continue to Certificate Upload'}
              </button>

              <p className="text-center text-xs text-[#8a9ab0]">
                Step 1 of 3: Profile Details
              </p>
            </form>
          </div>
        )}

        {/* STEP 2: Certificate Upload */}
        {currentStep === 2 && (
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
            
            {/* Header */}
            <div className="p-10 pb-8" style={{ background: 'linear-gradient(160deg, #2d5a8e, #1a3a6e)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>📜</div>
                <span className="text-white text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Upload Certificate
                </span>
              </div>
              <p className="text-white/70 text-sm">
                Upload your medical certificate for verification. Our admin team will review it.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadCertificate} className="p-10 space-y-5">
              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-[#4a5a6a] mb-2">
                  Medical Certificate *
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
                disabled={loading || !certificate}
                className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 mt-6"
                style={{
                  background: loading || !certificate ? '#a8c5e0' : 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)',
                  opacity: loading || !certificate ? 0.7 : 1,
                  cursor: loading || !certificate ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '📤 Uploading & Requesting Approval...' : 'Upload & Request Approval'}
              </button>

              <p className="text-center text-xs text-[#8a9ab0]">
                Step 2 of 3: Certificate Verification
              </p>
            </form>
          </div>
        )}

        {/* STEP 3: Complete */}
        {currentStep === 3 && (
          <div className="rounded-3xl overflow-hidden text-center"
            style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,90,142,0.15)' }}>
            
            <div className="p-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
                style={{ background: 'rgba(58,123,213,0.1)' }}>✅</div>
              <h3 className="text-xl font-semibold text-[#2d5a8e] mb-2">
                All Done!
              </h3>
              <p className="text-[#4a5a6a] text-sm mb-6">
                Your profile and certificate have been submitted. Our admin team will review and get back to you soon.
              </p>
              <button
                onClick={() => navigate('/doctor-dashboard')}
                className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #3a7bd5 0%, #2d5a8e 100%)',
                  boxShadow: '0 4px 12px rgba(58,123,213,0.2)'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorProfileSetup
