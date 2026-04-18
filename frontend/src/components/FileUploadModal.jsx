import { useState } from 'react'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'

const FileUploadModal = ({ onFileUploaded, onClose }) => {
  const { showToast } = useToast()
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      showToast('Only PDF, JPEG, PNG files allowed', 'error')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!selectedFile) {
      showToast('Please select a file', 'error')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('fileType', 'medical_report')

      const res = await profileService.uploadFile(formData)
      showToast('File uploaded successfully!', 'success')

      // Reset form
      setSelectedFile(null)
      // Trigger callback to refresh file list in parent
      onFileUploaded?.()
    } catch (err) {
      showToast(err.message || 'Failed to upload file', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
      <h3 className="text-lg font-semibold text-[#1a2a3a] mb-4">Upload Medical Files</h3>
      <p className="text-sm text-[#8a9ab0] mb-6">Add your medical documents securely</p>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Upload Input */}
        <div>
          <label className="block text-xs font-medium text-[#8a9ab0] uppercase tracking-wide mb-2">Select File</label>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpeg,.jpg,.png"
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="px-4 py-3 rounded-lg border-2 border-dashed border-[#d0daea] text-center hover:border-[#3a7bd5] transition-colors"
              style={{ background: '#f8f9fc' }}>
              <div className="text-2xl mb-1">📁</div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-[#3a7bd5]">{selectedFile.name}</p>
                  <p className="text-xs text-[#8a9ab0] mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-[#4a5a6a]">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#8a9ab0] mt-1">PDF, JPEG, PNG (max 5MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="w-full py-2.5 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: loading || !selectedFile
              ? '#a8c5e0' 
              : 'linear-gradient(135deg, #3a7bd5, #2d5a8e)',
            boxShadow: loading || !selectedFile
              ? 'none'
              : '0 4px 12px rgba(58,123,213,0.2)'
          }}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  )
}

export default FileUploadModal
