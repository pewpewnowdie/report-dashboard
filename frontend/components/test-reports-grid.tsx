'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle, CheckCircle, XCircle, User, Zap, Copy, Download, ExternalLink, Loader } from 'lucide-react'
import { getReports, generateReport, generateReportPytest, generateReportRobot } from '@/lib/api'

interface TestReportsGridProps {
  testType: 'pytest' | 'load' | 'robot'
  selectedProject: string
  selectedRelease: string
  onReportSelect: (reportId: string, type: 'pytest' | 'load' | 'robot') => void
}

function getStatusColor(status: string) {
  if (status === 'STARTED' || status === 'running') return 'text-yellow-500'
  if (status === 'FAILED' || status === 'failed') return 'text-red-500'
  return 'text-green-500'
}

function PytestReportItem({ report, onSelect }: { report: any; onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [copyNotification, setCopyNotification] = useState(false)
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set())

  const passRate = report.total ? Math.round((report.passed / report.total) * 100) : 0
  const passed = report.passed || 0
  const failed = report.failed || 0
  const skipped = report.skipped || 0
  const total = report.total || 0

  const startedAt = report.started_at ? new Date(report.started_at).toLocaleString() : 'N/A'
  const startedBy = report.started_by || 'Unknown'

  const handleGenerateReport = async () => {
    setIsGenerating(true)

    try {
      const response = await generateReportPytest(report.run_id)

      setReportUrl(response.report_url)
      setDownloadUrl(response.download_url)

      console.log('[PytestReportItem] Report generated:', response)
    } catch (error) {
      console.error('[PytestReportItem] Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyUrl = () => {
    if (reportUrl) {
      navigator.clipboard.writeText(reportUrl)
      setCopyNotification(true)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const toggleTestExpanded = (idx: number) => {
    const newExpanded = new Set(expandedTests)
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx)
    } else {
      newExpanded.add(idx)
    }
    setExpandedTests(newExpanded)
  }

  const getStatusIcon = (failed: number, total: number, skipped: number) => {
    if (failed > 0) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    if (total == 0 || total === skipped) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }


  return (
    <div className="border border-border rounded-lg overflow-hidden cursor-pointer">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon(report.failed || 0, report.total || 0, report.skipped || 0)}
          <div className="text-left flex-1">
            <p className="font-medium text-foreground">{report.run_name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>Started: {startedAt}</span>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{startedBy}</span>
              </div>
            </div>
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
              <div className="space-y-2">
                {report.tests.map((test: any, idx: number) => {
                  const isExpanded = expandedTests.has(idx)
                  const hasDetails = test.error_message || test.std_out

                  return (
                    <div key={idx} className="text-xs bg-card rounded border border-border/50 overflow-hidden">
                      <button
                        onClick={() => toggleTestExpanded(idx)}
                        className="w-full flex items-start gap-2 p-3 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {test.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{test.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{test.file_path}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{test.duration}s</span>
                          {hasDetails && (
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>
                      </button>

                      {isExpanded && hasDetails && (
                        <div className="px-3 pb-3 border-t border-border/50 space-y-2 bg-card/50">
                          {test.error_message && (
                            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                              <p className="text-red-500 font-mono text-xs whitespace-pre-wrap break-words">
                                {test.error_message}
                              </p>
                            </div>
                          )}
                          {test.std_out && (
                            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                              <p className="text-blue-500 font-mono text-xs whitespace-pre-wrap break-words">
                                {test.std_out}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Generate Report Section */}
          {!reportUrl ? (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate HTML Report</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">HTML Report</p>
              <div className="flex gap-2">
                {/* View Report Button */}
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Report</span>
                </a>

                {/* Download Report Button */}
                <a
                  href={downloadUrl || '#'}
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>

                {/* Copy URL Button */}
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors relative"
                  title="Copy report URL to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  {copyNotification && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
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

function RobotReportItem({ report, onSelect }: { report: any; onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [copyNotification, setCopyNotification] = useState(false)
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set())

  const passRate = report.total ? Math.round((report.passed / report.total) * 100) : 0
  const passed = report.passed || 0
  const failed = report.failed || 0
  const skipped = report.skipped || 0
  const total = report.total || 0

  const startedAt = report.started_at ? new Date(report.started_at).toLocaleString() : 'N/A'
  const startedBy = report.started_by || 'Unknown'

  const handleGenerateReport = async () => {
    setIsGenerating(true)

    try {
      const response = await generateReportRobot(report.run_id)

      setReportUrl(response.report_url)
      setDownloadUrl(response.download_url)

      console.log('[RobotReportItem] Report generated:', response)
    } catch (error) {
      console.error('[RobotReportItem] Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyUrl = () => {
    if (reportUrl) {
      navigator.clipboard.writeText(reportUrl)
      setCopyNotification(true)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const toggleTestExpanded = (idx: number) => {
    const newExpanded = new Set(expandedTests)
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx)
    } else {
      newExpanded.add(idx)
    }
    setExpandedTests(newExpanded)
  }

  const getStatusIcon = (failed: number, total: number, skipped: number) => {
    if (failed > 0) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    if (total == 0 || total === skipped) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }


  return (
    <div className="border border-border rounded-lg overflow-hidden cursor-pointer">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon(report.failed || 0, report.total || 0, report.skipped || 0)}
          <div className="text-left flex-1">
            <p className="font-medium text-foreground">{report.run_name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>Started: {startedAt}</span>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{startedBy}</span>
              </div>
            </div>
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
              <div className="space-y-2">
                {report.tests.map((test: any, idx: number) => {
                  const isExpanded = expandedTests.has(idx)
                  const hasDetails = test.error || test.info || test.warn || test.debug

                  return (
                    <div key={idx} className="text-xs bg-card rounded border border-border/50 overflow-hidden">
                      <button
                        onClick={() => toggleTestExpanded(idx)}
                        className="w-full flex items-start gap-2 p-3 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {test.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{test.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{test.file_path}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{test.duration}s</span>
                          {hasDetails && (
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>
                      </button>

                      {isExpanded && hasDetails && (
                        <div className="px-3 pb-3 border-t border-border/50 space-y-2 bg-card/50">
                          {test.error && (
                            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                              <p className="text-red-500 font-mono text-xs whitespace-pre-wrap break-words">
                                {test.error}
                              </p>
                            </div>
                          )}
                          {test.info && (
                            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                              <p className="text-blue-500 font-mono text-xs whitespace-pre-wrap break-words">
                                {test.info}
                              </p>
                            </div>
                          )}
                          {test.warn && (
                            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                              <p className="text-yellow-500 font-mono text-xs whitespace-pre-wrap break-words">
                                {test.warn}
                              </p>
                            </div>
                          )}
                          {test.debug && (
                            <div className="p-2 bg-gray-500/10 border border-gray-500/30 rounded">
                              <p className="text-gray-500 font-mono text-xs whitespace-pre-wrap break-words">
                                {test.debug}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Generate Report Section */}
          {!reportUrl ? (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate HTML Report</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">HTML Report</p>
              <div className="flex gap-2">
                {/* View Report Button */}
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Report</span>
                </a>

                {/* Download Report Button */}
                <a
                  href={downloadUrl || '#'}
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>

                {/* Copy URL Button */}
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors relative"
                  title="Copy report URL to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  {copyNotification && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [copyNotification, setCopyNotification] = useState(false)

  const endedAt = report.ended_at ? new Date(report.ended_at).toLocaleString() : 'N/A'
  const startedBy = report.started_by || 'Unknown'

  // JMeter metrics are stored as strings with units
  const errorRate = report.error_rate || '0%'
  const avgResponseTime = report.avg_response_time || '0ms'
  const throughput = report.throughput || '0'
  const duration = report.duration || '0'
  const vUsers = report.v_users || '0'
  const scriptName = report.script_name || 'N/A'

  const getErrorRateColor = (errorRateStr: string) => {
    try {
      const numericValue = parseFloat(errorRateStr)
      return numericValue > 1 ? 'text-red-500' : 'text-green-500'
    } catch {
      return 'text-gray-500'
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)

    try {
      const response = await generateReport(report.run_id)

      setReportUrl(response.report_url)
      setDownloadUrl(response.download_url)

      console.log('[JmeterReportItem] Report generated:', response)
    } catch (error) {
      console.error('[JmeterReportItem] Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyUrl = () => {
    if (reportUrl) {
      const textArea = document.createElement("textarea")
      textArea.value = reportUrl
      textArea.style.position = "fixed"
      textArea.style.top = "0"
      textArea.style.left = "0"
      textArea.style.opacity = "0"

      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      document.execCommand("copy")

      document.body.removeChild(textArea)
      setCopyNotification(true)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const getStatusIcon = (errorRateStr: string) => {
    try {
      const numericValue = parseFloat(errorRateStr)
      if (numericValue > 5) {
        return <XCircle className="w-5 h-5 text-red-500" />
      }
      if (numericValue > 1) {
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      }
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } catch (error) {
      return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden cursor-pointer">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon(errorRate)}
          <div className="text-left flex-1">
            <p className="font-medium text-foreground">{report.run_name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>Ended: {endedAt}</span>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{startedBy}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`font-semibold text-foreground ${getErrorRateColor(errorRate)}`}>{errorRate}</p>
            <p className="text-xs text-muted-foreground">Error Rate</p>
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
              <p className="text-lg font-bold text-foreground">{vUsers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Throughput</p>
              <p className="text-lg font-bold text-foreground">{throughput}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-bold text-foreground">{duration}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
              <p className={`text-lg font-bold ${getErrorRateColor(errorRate)}`}>
                {errorRate}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
              <p className="text-lg font-bold text-foreground">{avgResponseTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Script Name</p>
              <p className="text-lg font-bold text-foreground">{scriptName}</p>
            </div>
          </div>

          {/* Generate Report Section */}
          {!reportUrl ? (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate HTML Report</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">HTML Report</p>
              <div className="flex gap-2">
                {/* View Report Button */}
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Report</span>
                </a>

                {/* Download Report Button */}
                <a
                  href={downloadUrl || '#'}
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>

                {/* Copy URL Button */}
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors relative"
                  title="Copy report URL to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  {copyNotification && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
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

        if (testType === 'pytest') {
          // Use pytest_runs from the initial fetch
          reportList = data.pytest_runs || data.pytestReports || data.pytest || []
          console.log('[TestReportsGrid] Pytest reports found:', reportList.length)
        } else if (testType === 'load') {
          // Use jmeter_runs from the initial fetch
          reportList = data.jmeter_runs || data.jmeterReports || data.jmeter || []
          console.log('[TestReportsGrid] JMeter reports found:', reportList.length)
        } else if (testType === 'robot') {
          // Use robot_runs from the initial fetch
          reportList = data.robot_runs || data.robotReports || data.robot || []
          console.log('[TestReportsGrid] Robot reports found:', reportList.length)
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

      {testType === 'pytest' ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">PyTest</h2>
          {reports.length > 0 ? (
            reports.map((report) => (
              <PytestReportItem
                key={report.run_id}
                report={report}
                onSelect={(id) => onReportSelect(id, 'pytest')}
              />
            ))
          ) : (
            <p className="text-muted-foreground">
              {allReports.length === 0
                ? 'No pytest runs available for this release.'
                : 'No tests match your search.'}
            </p>
          )}
        </div>
      ) : testType === 'load' ? (
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
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">Robot Framework</h2>
          {reports.length > 0 ? (
            reports.map((report) => (
              <RobotReportItem
                key={report.run_id}
                report={report}
                onSelect={(id) => onReportSelect(id, 'robot')}
              />
            ))
          ) : (
            <p className="text-muted-foreground">
              {allReports.length === 0
                ? 'No robot framework tests available for this release.'
                : 'No tests match your search.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}