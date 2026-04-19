import { useState, useEffect } from 'react'
import useToast from '../hooks/useToast'
import { profileService } from '../services/profileService'

const DoctorAccessReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    loadAccessibleReports()
  }, [])

  const loadAccessibleReports = async () => {
    setLoading(true)
    try {
      // Get all access requests where status is approved
      const res = await profileService.getMedicalRequests()
      console.log('[DoctorAccessReports] API Response:', res.data)
      console.log('[DoctorAccessReports] Total requests:', res.data.requests?.length)
      
      const allRequests = res.data.requests || []
      console.log('[DoctorAccessReports] All requests:', allRequests)
      
      const approvedRequests = allRequests.filter(r => {
        console.log(`[DoctorAccessReports] Checking request id=${r.id}, status=${r.status}`)
        return r.status === 'approved'
      })
      
      console.log('[DoctorAccessReports] Approved requests:', approvedRequests)
      setReports(approvedRequests)
    } catch (error) {
      console.error('[DoctorAccessReports] Error:', error)
      showToast(error.response?.data?.error || 'Failed to load reports', 'error')
    } finally {
      setLoading(false)
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

  const filteredReports = reports.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#1a2a3a] mb-1">
          Medical Report Access
        </h2>
        <p className="text-sm text-[#8a9ab0]">
          View and manage patient medical reports you have been granted access to
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e6ecf5', boxShadow: '0 4px 24px rgba(45,90,142,0.08)' }}>
        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by patient name or report..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-11 rounded-lg border border-[#e6ecf5] focus:outline-none focus:border-[#3a7bd5] transition-all"
              style={{ background: '#f8f9fc' }}
            />
            <span className="absolute left-3.5 top-3.5 text-lg">🔍</span>
          </div>
          {searchTerm && (
            <div className="text-xs text-[#8a9ab0] mt-2">
              Found {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-[#8a9ab0] font-medium">No accessible reports yet</p>
            <p className="text-sm text-[#8a9ab0] mt-1">
              Patients will grant you access to their medical reports. They will appear here once approved.
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔎</div>
            <p className="text-[#8a9ab0] font-medium">No reports match your search</p>
            <p className="text-sm text-[#8a9ab0] mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#e6ecf5] hover:border-[#3a7bd5] transition-all"
                style={{ background: '#f8f9fc' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-[#1a2a3a]">
                      📋 {report.fileName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-[#8a9ab0]">
                      👤 <span className="font-medium text-[#1a2a3a]">{report.patientName}</span>
                    </span>
                    <span className="text-xs text-[#8a9ab0]">
                      ✓ Approved {formatDate(report.updatedAt)}
                    </span>
                    {report.expiresAt && (
                      <span className="text-xs text-[#e53e3e]">
                        📅 Expires {formatDate(report.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // In future, this could open a viewer
                    showToast('Report viewer coming soon', 'info')
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all flex-shrink-0 hover:-translate-y-px"
                  style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)' }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {reports.length > 0 && !loading && (
          <div className="mt-6 pt-6 border-t border-[#e6ecf5]">
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-[#8a9ab0]">Total accessible reports:</span>
                <span className="font-semibold text-[#1a2a3a] ml-2">{reports.length}</span>
              </div>
              <div>
                <span className="text-[#8a9ab0]">Active access:</span>
                <span className="font-semibold text-[#1a9e6a] ml-2">
                  {reports.filter(r => !r.expiresAt || new Date(r.expiresAt) > new Date()).length}
                </span>
              </div>
              <div>
                <span className="text-[#8a9ab0]">Expiring soon:</span>
                <span className="font-semibold text-[#b07a00] ml-2">
                  {reports.filter(r => r.expiresAt && new Date(r.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorAccessReports
