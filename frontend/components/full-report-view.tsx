'use client'

import { ArrowLeft, Download, ExternalLink, FileText, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { generateReport, getJmeterRun, getPytestRun } from '@/lib/api'

interface FullReportViewProps {
  reportId: string
  testType: 'automation' | 'load'
  onClose: () => void
}

// Sample Automation Test Report (Pytest)
const AUTOMATION_REPORT = {
  'auto-1': {
    name: 'UI Component Tests',
    run_id: 'ba0a2c7c-94e9-4d00-b1a9-323ddbcaa802',
    run_name: 'UI Component Tests Run',
    status: 'FINISHED',
    started_by: 'john.doe@company.com',
    release: 'v1.0.0',
    started_at: '2026-02-23T05:50:22.262929',
    ended_at: '2026-02-23T05:50:22.262929',
    duration: '0m 32s',
    passed: 156,
    failed: 6,
    skipped: 0,
    total: 162,
    tests: [
      {
        name: 'test_button_component',
        status: 'passed',
        duration: 0.5,
        error_message: '',
      },
      {
        name: 'test_form_validation',
        status: 'passed',
        duration: 1.2,
        error_message: '',
      },
      {
        name: 'test_modal_behavior',
        status: 'failed',
        duration: 2.1,
        error_message: 'Modal did not close on outside click',
      },
    ],
    files: {
      csv: { name: 'report.csv', url: 'http://...' },
      json: { name: 'result.json', url: 'http://...' },
    },
  },
  'auto-2': {
    name: 'API Integration Tests',
    run_id: 'ca1b3d5e-2e3f-4a2b-8c9d-4e5f6g7h8i9j',
    run_name: 'API Integration Tests Run',
    status: 'FINISHED',
    started_by: 'jane.smith@company.com',
    release: 'v1.0.0',
    started_at: '2026-02-23T04:30:00.000000',
    ended_at: '2026-02-23T04:31:15.000000',
    duration: '1m 15s',
    passed: 89,
    failed: 0,
    skipped: 0,
    total: 89,
    tests: [
      {
        name: 'test_get_users_endpoint',
        status: 'passed',
        duration: 0.3,
        error_message: '',
      },
      {
        name: 'test_create_user_endpoint',
        status: 'passed',
        duration: 0.4,
        error_message: '',
      },
    ],
    files: {
      csv: { name: 'report.csv', url: 'http://...' },
      json: { name: 'result.json', url: 'http://...' },
    },
  },
  'auto-3': {
    name: 'E2E Workflows',
    run_id: 'db2c4e6f-3f4g-5b3c-9d0e-5f6g7h8i9j0k',
    run_name: 'E2E Workflows Run',
    status: 'FINISHED',
    started_by: 'bob.wilson@company.com',
    release: 'v1.2.0-beta',
    started_at: '2026-02-23T03:15:00.000000',
    ended_at: '2026-02-23T03:18:45.000000',
    duration: '3m 45s',
    passed: 37,
    failed: 5,
    skipped: 0,
    total: 42,
    tests: [
      {
        name: 'test_user_login_flow',
        status: 'passed',
        duration: 2.1,
        error_message: '',
      },
      {
        name: 'test_checkout_flow',
        status: 'failed',
        duration: 3.5,
        error_message: 'Payment confirmation timeout after 30 seconds',
      },
    ],
    files: {
      csv: { name: 'report.csv', url: 'http://...' },
      json: { name: 'result.json', url: 'http://...' },
    },
  },
  'auto-4': {
    name: 'Authentication Flow',
    run_id: 'ec3d5f7g-4g5h-6c4d-0e1f-6g7h8i9j0k1l',
    run_name: 'Authentication Tests Run',
    status: 'FINISHED',
    started_by: 'alice.johnson@company.com',
    release: 'v1.0.0',
    started_at: '2026-02-23T06:00:00.000000',
    ended_at: '2026-02-23T06:01:08.000000',
    duration: '1m 8s',
    passed: 66,
    failed: 1,
    skipped: 0,
    total: 67,
    tests: [
      {
        name: 'test_login_with_valid_credentials',
        status: 'passed',
        duration: 0.4,
        error_message: '',
      },
      {
        name: 'test_refresh_token',
        status: 'failed',
        duration: 0.8,
        error_message: 'Token refresh failed: Invalid refresh token',
      },
    ],
    files: {
      csv: { name: 'report.csv', url: 'http://...' },
      json: { name: 'result.json', url: 'http://...' },
    },
  },
  'auto-5': {
    name: 'Payment Processing',
    run_id: 'fd4e6g8h-5h6i-7d5e-1f2g-7h8i9j0k1l2m',
    run_name: 'Payment Processing Tests Run',
    status: 'FINISHED',
    started_by: 'charlie.brown@company.com',
    release: 'v1.2.0-beta',
    started_at: '2026-02-23T05:30:00.000000',
    ended_at: '2026-02-23T05:32:03.000000',
    duration: '2m 3s',
    passed: 21,
    failed: 7,
    skipped: 0,
    total: 28,
    tests: [
      {
        name: 'test_process_payment',
        status: 'failed',
        duration: 1.2,
        error_message: 'Payment gateway returned error: Insufficient funds',
      },
      {
        name: 'test_refund_processing',
        status: 'failed',
        duration: 0.9,
        error_message: 'Refund API endpoint not responding',
      },
    ],
    files: {
      csv: { name: 'report.csv', url: 'http://...' },
      json: { name: 'result.json', url: 'http://...' },
    },
  },
  'auto-6': {
    name: 'Database Operations',
    run_id: 'ge5f7h9i-6i7j-8e6f-2g3h-8i9j0k1l2m3n',
    run_name: 'Database Ops Tests Run',
    status: 'FINISHED',
    started_by: 'diana.prince@company.com',
    release: 'v1.0.0',
    started_at: '2026-02-23T05:00:00.000000',
    ended_at: '2026-02-23T05:01:56.000000',
    duration: '1m 56s',
    passed: 112,
    failed: 0,
    skipped: 0,
    total: 112,
    tests: [
      {
        name: 'test_create_record',
        status: 'passed',
        duration: 0.2,
        error_message: '',
      },
      {
        name: 'test_query_performance',
        status: 'passed',
        duration: 0.1,
        error_message: '',
      },
    ],
    files: {
      csv: { name: 'report.csv', url: 'http://...' },
      json: { name: 'result.json', url: 'http://...' },
    },
  },
}

// Sample Load Test Report (JMeter)
const LOAD_REPORT = {
  'load-1': {
    name: 'API Load Test - Peak Hours',
    run_id: 'jmeter-001',
    run_name: 'Load Test Run 1',
    status: 'completed',
    started_by: 'john.doe@company.com',
    release: 'v1.0.0',
    ended_at: '2024-02-19T15:30:00Z',
    report_url: 'https://reports.example.com/jmeter-001',
    script_name: 'login_flow.jmx',
    run_status: 'success',
    duration: 600,
    v_users: 500,
    avg_response_time: 245,
    error_rate: 0.02,
    throughput: 15320,
    project_key: 'PROJ-A',
    files: {
      jmx: { name: 'login_flow.jmx', url: '/files/jmeter/jmeter-001/jmx' },
      jtl: { name: 'results.jtl', url: '/files/jmeter/jmeter-001/jtl' },
      log: { name: 'jmeter.log', url: '/files/jmeter/jmeter-001/log' },
    },
  },
  'load-2': {
    name: 'Web Application Stress Test',
    run_id: 'jmeter-002',
    run_name: 'Stress Test Run',
    status: 'completed',
    started_by: 'jane.smith@company.com',
    release: 'v1.1.0',
    ended_at: '2024-02-19T16:45:00Z',
    report_url: null,
    script_name: 'full_workflow.jmx',
    run_status: 'success',
    duration: 2700,
    v_users: 1000,
    avg_response_time: 512,
    error_rate: 0.15,
    throughput: 8920,
    project_key: 'PROJ-B',
    files: {
      jmx: { name: 'full_workflow.jmx', url: '/files/jmeter/jmeter-002/jmx' },
      jtl: { name: 'results.jtl', url: '/files/jmeter/jmeter-002/jtl' },
      log: { name: 'jmeter.log', url: '/files/jmeter/jmeter-002/log' },
    },
  },
  'load-3': {
    name: 'Database Connection Pool',
    run_id: 'jmeter-003',
    run_name: 'Database Load Test',
    status: 'completed',
    started_by: 'bob.wilson@company.com',
    release: 'v1.2.0-beta',
    ended_at: '2024-02-19T17:20:00Z',
    report_url: 'https://reports.example.com/jmeter-003',
    script_name: 'db_operations.jmx',
    run_status: 'success',
    duration: 1200,
    v_users: 250,
    avg_response_time: 145,
    error_rate: 0,
    throughput: 22500,
    project_key: 'PROJ-C',
    files: {
      jmx: { name: 'db_operations.jmx', url: '/files/jmeter/jmeter-003/jmx' },
      jtl: { name: 'results.jtl', url: '/files/jmeter/jmeter-003/jtl' },
      log: { name: 'jmeter.log', url: '/files/jmeter/jmeter-003/log' },
    },
  },
  'load-4': {
    name: 'Payment Gateway Resilience',
    run_id: 'jmeter-004',
    run_name: 'Payment Gateway Load Test',
    status: 'completed',
    started_by: 'alice.johnson@company.com',
    release: 'v1.2.0-beta',
    ended_at: '2024-02-19T18:00:00Z',
    report_url: null,
    script_name: 'payment_flow.jmx',
    run_status: 'failed',
    duration: 1500,
    v_users: 200,
    avg_response_time: 1200,
    error_rate: 3.45,
    throughput: 2100,
    project_key: 'PROJ-D',
    files: {
      jmx: { name: 'payment_flow.jmx', url: '/files/jmeter/jmeter-004/jmx' },
      jtl: { name: 'results.jtl', url: '/files/jmeter/jmeter-004/jtl' },
      log: { name: 'jmeter.log', url: '/files/jmeter/jmeter-004/log' },
    },
  },
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
        if (testType === 'automation') {
          data = await getPytestRun(reportId)
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

  const isAutomation = testType === 'automation'
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
          {isAutomation ? 'Automated Test Report' : 'Load Test Report'} • Run ID: {report.run_id}
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
              {formatDuration(report.duration, isAutomation ? undefined : report.duration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Release</p>
            <p className="text-sm font-medium text-foreground">{report.release}</p>
          </div>
        </div>

        {/* Automation Test Content */}
        {isAutomation && (
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
        {!isAutomation && (
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
        {!isAutomation && (
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
