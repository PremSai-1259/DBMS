import { useState, useEffect } from 'react'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'
import PatientProfileModal from './PatientProfileModal'

const DoctorAccessReports = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [viewingFile, setViewingFile] = useState(null)
  const [viewingFileUrl, setViewingFileUrl] = useState(null)
  const [viewingFileType, setViewingFileType] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    loadGrantedFiles()
  }, [])

  useEffect(() => {
    return () => {
      if (viewingFileUrl) {
        window.URL.revokeObjectURL(viewingFileUrl)
      }
    }
  }, [viewingFileUrl])

  const loadGrantedFiles = async () => {
    setLoading(true)
    try {
      // Get all access requests
      const res = await profileService.getMedicalRequests()
      const allRequests = res.data.requests || []
      
      console.log('=== DOCTOR ACCESS REPORTS API RESPONSE ===')
      console.log('Full response:', res.data)
      console.log('All requests:', allRequests)
      if (allRequests.length > 0) {
        console.log('First request full object:', JSON.stringify(allRequests[0], null, 2))
        console.log('First request keys:', Object.keys(allRequests[0]))
      }

      // Filter for approved requests only
      const approvedFiles = allRequests.filter(r => r.status === 'approved')
      console.log('Approved files count:', approvedFiles.length)
      if (approvedFiles.length > 0) {
        console.log('First approved file:', JSON.stringify(approvedFiles[0], null, 2))
      }
      
      setFiles(approvedFiles)
    } catch (error) {
      console.error('Error loading granted files:', error)
      showToast(error.response?.data?.error || 'Failed to load files', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFileId = (file) => {
    const fileId = file.fileId || file.file_id || file.id
    console.log('DEBUG: File object keys:', Object.keys(file))
    console.log('DEBUG: file.fileId=', file.fileId, 'file.id=', file.id, 'returning=', fileId)
    return fileId
  }

  const resolveFileId = async (file) => {
    const directFileId = file.fileId || file.file_id
    if (directFileId) return directFileId

    if (file.patientId && file.fileName) {
      try {
        const summaryRes = await profileService.getDoctorPatientSummary(file.patientId)
        const matchedDocument = (summaryRes.data?.documents || []).find((document) =>
          document.fileName === file.fileName && document.accessStatus === 'approved'
        )

        if (matchedDocument?.id) {
          return matchedDocument.id
        }
      } catch (error) {
        console.error('Failed to resolve fileId from patient summary:', error)
      }
    }

    return file.id || null
  }

  const closePreview = () => {
    if (viewingFileUrl) {
      window.URL.revokeObjectURL(viewingFileUrl)
    }
    setViewingFileUrl(null)
    setViewingFileType('')
    setPreviewError('')
    setViewingFile(null)
  }

  const handleViewFile = async (file) => {
    console.log('=== HANDLE VIEW FILE CALLED ===')
    console.log('File object:', file)
    const fileId = await resolveFileId(file)
    console.log('Extracted fileId:', fileId)

    if (!fileId) {
      console.error('❌ No fileId found')
      showToast('File ID is missing for this report', 'error')
      return
    }

    setViewingFile(file)
    setPreviewLoading(true)
    setPreviewError('')

    try {
      const preview = await profileService.previewFile(fileId)
      setViewingFileUrl(preview.url)
      setViewingFileType(preview.contentType || '')
    } catch (error) {
      console.error('Preview error:', error)
      setViewingFile(null)
      showToast(error.response?.data?.error || 'Failed to preview file', 'error')
    } finally {
      setPreviewLoading(false)
    }
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

  const getPreviewSrc = () => {
    if (!viewingFileUrl) return ''

    if (viewingFileType === 'application/pdf') {
      return `${viewingFileUrl}#toolbar=0&navpanes=0&scrollbar=0`
    }

    return viewingFileUrl
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
                    onClick={() => handleViewFile(file)}
                    disabled={!getFileId(file)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#d69e2e] transition-all flex-shrink-0 hover:-translate-y-px"
                    style={{ background: '#fff5e6', border: '1px solid #fbd38d' }}
                  >
                    👁️ View
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

      {/* File Viewer Modal */}
      {viewingFile && (
        <>
          {console.log('🎬 File viewer rendering for:', viewingFile.fileName)}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closePreview}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[72vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#e6ecf5]">
                <div>
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">
                    📄 {viewingFile.fileName}
                  </h3>
                  <p className="text-sm text-[#8a9ab0] mt-1">
                    From: <span className="font-medium">{viewingFile.patientName}</span>
                  </p>
                </div>
                <button
                  onClick={closePreview}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f5] transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Preview area */}
              <div className="flex-1 overflow-hidden bg-gray-100">
                {previewLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin mx-auto mb-3" />
                      <p className="text-sm text-[#4a5a6a]">Loading preview...</p>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <p className="text-sm font-medium text-[#e53e3e] mb-2">Preview unavailable</p>
                      <p className="text-sm text-[#4a5a6a]">{previewError}</p>
                    </div>
                  </div>
                ) : viewingFileUrl && viewingFileType.startsWith('image/') ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <img
                      src={viewingFileUrl}
                      alt={viewingFile.fileName}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="relative h-full w-full overflow-hidden">
                    {viewingFileType === 'application/pdf' && (
                      <div
                        className="absolute left-0 top-0 z-10 h-12 w-full border-b border-[#dfe6f1] bg-gray-100"
                        aria-hidden="true"
                      />
                    )}
                    <iframe
                      src={getPreviewSrc() || undefined}
                      className="w-full h-full border-none"
                      title={viewingFile.fileName}
                      onError={(e) => {
                        console.error('❌ preview error:', e)
                        setPreviewError('The report could not be displayed in the browser preview.')
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#e6ecf5] flex justify-end gap-2">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#1a2a3a] transition-all"
                  style={{ background: '#f0f2f5', border: '1px solid #e6ecf5' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DoctorAccessReports
