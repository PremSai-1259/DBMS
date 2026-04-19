import { useState, useEffect } from 'react'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'
import PatientProfileModal from './PatientProfileModal'

const DoctorAccessReports = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadGrantedFiles()
  }, [])

  const loadGrantedFiles = async () => {
    setLoading(true)
    try {
      // Get all access requests
      const res = await profileService.getMedicalRequests()
      const allRequests = res.data.requests || []

      // Filter for approved requests only
      const approvedFiles = allRequests.filter(r => r.status === 'approved')
      setFiles(approvedFiles)
    } catch (error) {
      console.error('Error loading granted files:', error)
      showToast(error.response?.data?.error || 'Failed to load files', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFileId = (file) => {
    // Handle both camelCase and snake_case field names
    const fileId = file.fileId || file.file_id
    console.log('DEBUG: File object keys:', Object.keys(file))
    console.log('DEBUG: file.fileId=', file.fileId, 'file.id=', file.id, 'returning=', fileId)
    return fileId
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDownloadFile = async (fileId, fileName) => {
    if (!fileId) {
      showToast('File ID is missing', 'error')
      return
    }
    
    setDownloadingId(fileId)
    try {
      await profileService.downloadFile(fileId, fileName)
      showToast(`Downloaded ${fileName}`, 'success')
    } catch (error) {
      console.error('Download error:', error)
      showToast(error.response?.data?.error || 'Failed to download file', 'error')
    } finally {
      setDownloadingId(null)
    }
  }



  // Search by patient name or report/file name
  const filteredFiles = files.filter(f =>
    f.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#1a2a3a] mb-1">
          📋 Access Reports
        </h2>
        <p className="text-sm text-[#8a9ab0]">
          Medical reports granted to you by patients
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
        {/* Summary Stats - TOP */}
        {!loading && files.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="text-center rounded-lg p-3" style={{ background: '#f8f9fc' }}>
              <p className="text-2xl font-semibold text-[#3a7bd5]">{files.length}</p>
              <p className="text-xs text-[#8a9ab0] mt-1">Total Files</p>
            </div>
            <div className="text-center rounded-lg p-3" style={{ background: '#f8f9fc' }}>
              <p className="text-2xl font-semibold text-[#3a7bd5]">
                {new Set(files.map(f => f.patientId)).size}
              </p>
              <p className="text-xs text-[#8a9ab0] mt-1">Unique Patients</p>
            </div>
            <div className="text-center rounded-lg p-3" style={{ background: '#f8f9fc' }}>
              <p className="text-2xl font-semibold text-[#3a7bd5]">
                {files.filter(f => !f.expiresAt || new Date(f.expiresAt) > new Date()).length}
              </p>
              <p className="text-xs text-[#8a9ab0] mt-1">Active</p>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by patient name or report name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-11 rounded-lg border border-[#e6ecf5] focus:outline-none focus:border-[#3a7bd5] transition-all"
              style={{ background: '#f8f9fc' }}
            />
            <span className="absolute left-3.5 top-3.5 text-lg">🔍</span>
          </div>
          {searchTerm && (
            <div className="text-xs text-[#8a9ab0] mt-2">
              Found {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-[#8a9ab0] font-medium">No files granted yet</p>
            <p className="text-sm text-[#8a9ab0] mt-1">
              Patients will grant you access to their medical reports
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔎</div>
            <p className="text-[#8a9ab0] font-medium">No files match your search</p>
            <p className="text-sm text-[#8a9ab0] mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#e6ecf5] hover:border-[#3a7bd5] hover:shadow-md transition-all"
                style={{ background: '#f8f9fc' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">📄</span>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1a2a3a]">
                        {file.fileName}
                      </h4>
                      <p className="text-xs text-[#8a9ab0]">
                        From: <span className="font-medium text-[#1a2a3a]">{file.patientName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <span className="text-[#8a9ab0]">
                      ✓ Approved {formatDate(file.updatedAt)}
                    </span>
                    {file.expiresAt && (
                      <span className="text-[#e53e3e]">
                        📅 Expires {formatDate(file.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedPatientId(file.patientId)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#1a9e6a] transition-all flex-shrink-0 hover:-translate-y-px"
                    style={{ background: '#e6f9f2', border: '1px solid #a3e5d1' }}
                  >
                    👤 Patient Profile
                  </button>
                  <button
                    onClick={() => handleDownloadFile(getFileId(file), file.fileName)}
                    disabled={downloadingId === getFileId(file)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-white transition-all flex-shrink-0 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}
                  >
                    {downloadingId === getFileId(file) ? '⏳' : '⬇️'} Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      {selectedPatientId && (
        <PatientProfileModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  )
}

export default DoctorAccessReports
