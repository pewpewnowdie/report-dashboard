'use client'

import { ArrowLeft, Download, ExternalLink, FileText, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { generateReport, getJmeterRun, getPytestRun, getRobotRun } from '@/lib/api'

interface FullReportViewProps {
  reportId: string
  testType: 'pytest' | 'load' | 'robot'
  onClose: () => void
}

function getStatusColor(status: string) {
  if (status === 'passed' || status === 'success' || status === 'FINISHED') {
    return 'text-green-500'
  }
  if (status === 'warning') {
    return 'text-yellow-500'
  }
  if (status === 'failed') {
    return 'text-red-500'
  }
  return 'text-foreground'
}

function formatDuration(seconds?: number, durationString?: string) {
  if (durationString) return durationString
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export function FullReportView({ reportId, testType, onClose }: FullReportViewProps) {
  const [report, setReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReportUrl, setGeneratedReportUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true)
      try {
        let data
        if (testType === 'pytest') {
          data = await getPytestRun(reportId)
        } else if (testType === 'robot') {
          data = await getRobotRun(reportId)
        } else {
          data = await getJmeterRun(reportId)
        }
        setReport(data)
        if (data.report_url) {
          setGeneratedReportUrl(data.report_url)
        }
      } catch (error) {
        console.error('Failed to fetch report:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      fetchReport()
    }
  }, [reportId, testType, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    )
  }

  const isPytest = testType === 'pytest'
  const currentReportUrl = generatedReportUrl || report.report_url

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const data = await generateReport(reportId)
      setGeneratedReportUrl(data.report_url)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Reports</span>
      </button>

      <div className="bg-card border border-border rounded-lg p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{report.name}</h1>
        <p className="text-muted-foreground mb-6">
          {isPytest ? 'Automated Test Report' : 'Load Test Report'} • Run ID: {report.run_id}
        </p>

        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <p className={`text-lg font-bold capitalize ${getStatusColor(report.status || report.run_status)}`}>
              {report.status || report.run_status}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Started By</p>
            <p className="text-sm font-medium text-foreground">{report.started_by}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Duration</p>
            <p className="text-lg font-bold text-foreground">
              {formatDuration(report.duration, isPytest ? undefined : report.duration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Release</p>
            <p className="text-sm font-medium text-foreground">{report.release}</p>
          </div>
        </div>

        {/* Automation Test Content */}
        {isPytest && (
          <div className="space-y-6">
            {/* Test Results Summary */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Test Results Summary</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Total Tests</p>
                  <p className="text-3xl font-bold text-foreground">{report.total}</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Passed</p>
                  <p className="text-3xl font-bold text-green-500">{report.passed}</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Failed</p>
                  <p className="text-3xl font-bold text-red-500">{report.failed}</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Skipped</p>
                  <p className="text-3xl font-bold text-muted-foreground">{report.skipped}</p>
                </div>
              </div>
            </div>

            {/* Individual Tests */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Individual Tests</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {report.tests?.map((test: any, idx: number) => (
                  <div key={idx} className="bg-secondary rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{test.name}</p>
                        {test.error_message && (
                          <p className="text-sm text-red-500 mt-2">{test.error_message}</p>
                        )}
                      </div>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        test.status === 'passed' 
                          ? 'bg-green-500/20 text-green-500'
                          : test.status === 'failed'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Duration: {test.duration}s</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Load Test Content */}
        {!isPytest && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Avg Response Time</p>
                  <p className="text-3xl font-bold text-foreground">{report.avg_response_time}ms</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Throughput</p>
                  <p className="text-3xl font-bold text-foreground">{report.throughput}</p>
                  <p className="text-xs text-muted-foreground">req/sec</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Error Rate</p>
                  <p className={`text-3xl font-bold ${report.error_rate > 1 ? 'text-red-500' : 'text-green-500'}`}>
                    {report.error_rate.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Virtual Users</p>
                  <p className="text-3xl font-bold text-foreground">{report.v_users}</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Test Duration</p>
                  <p className="text-3xl font-bold text-foreground">{Math.round(report.duration / 60)}m</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Script</p>
                  <p className="text-sm font-medium text-foreground truncate">{report.script_name}</p>
                </div>
              </div>
            </div>

            {/* Test Configuration */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Test Configuration</h2>
              <div className="bg-secondary rounded-lg p-4 border border-border space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Key:</span>
                  <span className="font-medium text-foreground">{report.project_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Run Name:</span>
                  <span className="font-medium text-foreground">{report.run_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ended At:</span>
                  <span className="font-medium text-foreground">{report.ended_at}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTML Report Section (Load Tests Only) */}
        {!isPytest && (
          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">HTML Report</h2>
            {currentReportUrl ? (
              <div className="bg-secondary rounded-lg p-6 border border-border">
                <div className="flex gap-3 mb-4">
                  <a
                    href={currentReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    <FileText className="w-4 h-4" />
                    View Report
                  </a>
                  <a
                    href={`${currentReportUrl}?download=true`}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-md hover:border-primary transition-colors text-foreground"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-secondary rounded-lg p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  No HTML report generated yet. Click the button below to generate one.
                </p>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Generate HTML Report'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Download Files */}
        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Download Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(report.files || {}).map(([key, file]: [string, any]) => (
              <a
                key={key}
                href={file.url}
                className="flex items-center gap-3 px-4 py-3 bg-secondary border border-border rounded-lg hover:border-primary transition-colors group"
              >
                <Download className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{key} File</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
