'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { getReports } from '@/lib/api'

interface TestReportsGridProps {
  testType: 'automation' | 'load'
  selectedProject: string
  selectedRelease: string
  onReportSelect: (reportId: string, type: 'automation' | 'load') => void
}

function getStatusIcon(status: string) {
  if (status === 'STARTED' || status === 'running') {
    return <AlertCircle className="w-5 h-5 text-yellow-500" />
  }
  if (status === 'FAILED' || status === 'failed') {
    return <XCircle className="w-5 h-5 text-red-500" />
  }
  return <CheckCircle className="w-5 h-5 text-green-500" />
}

function getStatusColor(status: string) {
  if (status === 'STARTED' || status === 'running') return 'text-yellow-500'
  if (status === 'FAILED' || status === 'failed') return 'text-red-500'
  return 'text-green-500'
}

function PytestReportItem({ report, onSelect }: { report: any; onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const passRate = report.total ? Math.round((report.passed / report.total) * 100) : 0
  const passed = report.passed || 0
  const failed = report.failed || 0
  const skipped = report.skipped || 0
  const total = report.total || 0

  const startedAt = report.started_at ? new Date(report.started_at).toLocaleString() : 'N/A'

  return (
    <div className="border border-border rounded-lg overflow-hidden cursor-pointer">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(report.status)}
          <div className="text-left">
            <p className="font-medium text-foreground">{report.run_name}</p>
            <p className="text-xs text-muted-foreground">Started: {startedAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-foreground">{passRate}%</p>
            <p className="text-xs text-muted-foreground">{passed}/{total}</p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-4 bg-secondary border-t border-border">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-foreground">{total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Passed</p>
              <p className="text-lg font-bold text-green-500">{passed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Failed</p>
              <p className="text-lg font-bold text-red-500">{failed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Skipped</p>
              <p className="text-lg font-bold text-yellow-500">{skipped}</p>
            </div>
          </div>

          {report.duration && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-sm text-foreground">{report.duration}</p>
            </div>
          )}

          {report.tests && report.tests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Test Results ({report.tests.length})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {report.tests.map((test: any, idx: number) => (
                  <div key={idx} className="text-xs p-3 bg-card rounded border border-border/50">
                    <div className="flex items-start gap-2">
                      {test.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{test.name}</p>
                        <p className="text-xs text-muted-foreground">Duration: {test.duration}s</p>
                        {test.error_message && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                            <p className="text-red-500 font-mono text-xs whitespace-pre-wrap break-words">
                              {test.error_message}
                            </p>
                          </div>
                        )}
                        {test.std_out && (
                          <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                            <p className="text-blue-500 font-mono text-xs whitespace-pre-wrap break-words">
                              {test.std_out}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.files && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-2">Files</p>
              <div className="space-y-1">
                {Object.entries(report.files).map(([key, file]: [string, any]) => (
                  <a
                    key={key}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block"
                  >
                    📄 {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function JmeterReportItem({ report, onSelect }: { report: any; onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const endedAt = report.ended_at ? new Date(report.ended_at).toLocaleString() : 'N/A'

  return (
    <div className="border border-border rounded-lg overflow-hidden cursor-pointer">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(report.run_status)}
          <div className="text-left">
            <p className="font-medium text-foreground">{report.run_name}</p>
            <p className="text-xs text-muted-foreground">Ended: {endedAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-foreground">{report.avg_response_time}ms</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-4 bg-secondary border-t border-border">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Virtual Users</p>
              <p className="text-lg font-bold text-foreground">{report.v_users}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Throughput</p>
              <p className="text-lg font-bold text-foreground">{report.throughput} req/s</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Max Response Time</p>
              <p className="text-lg font-bold text-foreground">
                {report.max_response_time || 'N/A'}ms
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
              <p className={`text-lg font-bold ${report.error_rate > 1 ? 'text-red-500' : 'text-green-500'}`}>
                {report.error_rate.toFixed(2)}%
              </p>
            </div>
          </div>

          {report.duration && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-sm text-foreground">{report.duration} seconds</p>
            </div>
          )}

          {report.files && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-2">Files</p>
              <div className="space-y-1">
                {Object.entries(report.files).map(([key, file]: [string, any]) => (
                  <a
                    key={key}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block"
                  >
                    📄 {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TestReportsGrid({
  testType,
  selectedProject,
  selectedRelease,
  onReportSelect,
}: TestReportsGridProps) {
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [allReports, setAllReports] = useState<any[]>([])

  // Fetch reports when project/release changes
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      try {
        const data = await getReports(selectedProject, selectedRelease)

        console.log('[TestReportsGrid] API Response:', data)

        // Use the data we already have (no additional API calls needed)
        let reportList = []

        if (testType === 'automation') {
          // Use pytest_runs from the initial fetch
          reportList = data.pytest_runs || data.pytestReports || data.pytest || []
          console.log('[TestReportsGrid] Pytest reports found:', reportList.length)
        } else {
          // Use jmeter_runs from the initial fetch
          reportList = data.jmeter_runs || data.jmeterReports || data.jmeter || []
          console.log('[TestReportsGrid] JMeter reports found:', reportList.length)
        }

        console.log('[TestReportsGrid] Final report list:', reportList)
        setAllReports(reportList)
        setReports(reportList) // Show all reports initially
        setSearchQuery('') // Reset search when reports change
      } catch (error) {
        console.error('[TestReportsGrid] Failed to fetch reports:', error)
        setAllReports([])
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [selectedProject, selectedRelease, testType])

  // Filter reports based on search query (separate from fetch)
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = allReports.filter((report: any) => {
        const name = report.run_name || report.name || ''
        return name.toLowerCase().includes(query)
      })
      setReports(filtered)
    } else {
      setReports(allReports)
    }
  }, [searchQuery, allReports])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Report Search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {testType === 'automation' ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">Automation Tests</h2>
          {reports.length > 0 ? (
            reports.map((report) => (
              <PytestReportItem
                key={report.run_id}
                report={report}
                onSelect={(id) => onReportSelect(id, 'automation')}
              />
            ))
          ) : (
            <p className="text-muted-foreground">
              {allReports.length === 0
                ? 'No automation tests available for this release.'
                : 'No tests match your search.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">Load Tests</h2>
          {reports.length > 0 ? (
            reports.map((report) => (
              <JmeterReportItem
                key={report.run_id}
                report={report}
                onSelect={(id) => onReportSelect(id, 'load')}
              />
            ))
          ) : (
            <p className="text-muted-foreground">
              {allReports.length === 0
                ? 'No load tests available for this release.'
                : 'No tests match your search.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}