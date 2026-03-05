'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { TestReportsGrid } from '@/components/test-reports-grid'
import { FullReportView } from '@/components/full-report-view'
import { getProjects } from '@/lib/api'
import { AlertCircle, LogOut } from 'lucide-react'

interface Project {
  key: string
  name: string
  releases: Array<{ key: string; name: string }>
}

function PageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null)
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null)
  const [selectedReleaseName, setSelectedReleaseName] = useState<string | null>(null)
  const [testType, setTestType] = useState<'pytest' | 'load' | 'robot'>('pytest')
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [selectedReportType, setSelectedReportType] = useState<'pytest' | 'load' | 'robot'>('pytest')
  const [error, setError] = useState<string | null>(null)
  // Track whether we've applied the initial query params (only do it once)
  const [initialParamsApplied, setInitialParamsApplied] = useState(false)

  // Update the URL to reflect the current state (no navigation, just replaces history entry)
  const syncUrlParams = useCallback(
    (projectKey: string, releaseId: string, runId?: string | null) => {
      const params = new URLSearchParams()
      params.set('project_key', projectKey)
      params.set('release_id', releaseId)
      params.set('test_type', testType)
      if (runId) params.set('run_id', runId)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState(null, '', newUrl)
    },
    [testType]
  )

  // Check auth and fetch projects
  useEffect(() => {
    const checkAuthAndFetchProjects = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        router.push('/login')
        return
      }

      try {
        const data = await getProjects()
        setProjects(data)

        // Read query params
        const qProject = searchParams.get('project_key')
        const qRelease = searchParams.get('release_id')
        const qRun = searchParams.get('run_id')
        const qTestType = searchParams.get('test_type') as 'pytest' | 'load' | 'robot' | null

        // Try to resolve project from query param, fall back to first project
        const matchedProject = qProject
          ? data.find((p: Project) => p.key === qProject)
          : null
        const targetProject: Project | undefined = matchedProject ?? data[0]

        if (targetProject) {
          setSelectedProject(targetProject.key)
          setSelectedProjectName(targetProject.name)

          if (targetProject.releases && targetProject.releases.length > 0) {
            // Try to resolve release from query param, fall back to first release
            const matchedRelease = qRelease
              ? targetProject.releases.find((r) => r.key === qRelease)
              : null
            const targetRelease = matchedRelease ?? targetProject.releases[0]

            setSelectedRelease(targetRelease.key)
            setSelectedReleaseName(targetRelease.name)

            // Apply test type from URL if valid, otherwise keep default
            if (qTestType && ['pytest', 'load', 'robot'].includes(qTestType)) {
              setTestType(qTestType)
            }

            // Mark that we've applied initial params so sidebar changes won't conflict
            // run_id (if present) is handled by initialRunId on TestReportsGrid —
            // it auto-expands the matching card using data already fetched by getReports.
            setInitialParamsApplied(true)

            // Sync URL to the resolved values
            syncUrlParams(targetProject.key, targetRelease.key, qRun)
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        setError('Failed to load projects. Please try logging in again.')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndFetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleTestTypeChange = (newType: 'pytest' | 'load' | 'robot') => {
    setTestType(newType)
    setSelectedReportId(null)
  }

  const handleReleaseChange = (newRelease: string) => {
    setSelectedRelease(newRelease)
    setSelectedReportId(null)

    const project = projects.find((p) => p.key === selectedProject)
    if (project) {
      const release = project.releases.find((r) => r.key === newRelease)
      if (release) {
        setSelectedReleaseName(release.name)
        if (selectedProject) syncUrlParams(selectedProject, newRelease)
      }
    }
  }

  const handleProjectChange = (newProject: string) => {
    setSelectedProject(newProject)
    setSelectedReportId(null)

    const project = projects.find((p) => p.key === newProject)
    if (project) {
      setSelectedProjectName(project.name)

      if (project.releases && project.releases.length > 0) {
        const firstRelease = project.releases[0]
        setSelectedRelease(firstRelease.key)
        setSelectedReleaseName(firstRelease.name)
        syncUrlParams(newProject, firstRelease.key)
      }
    }
  }

  // Called by the Share button inside a report item
  const handleShareRun = useCallback(
    (runId: string, runType: 'pytest' | 'load' | 'robot') => {
      if (!selectedProject || !selectedRelease) return
      const params = new URLSearchParams()
      params.set('project_key', selectedProject)
      params.set('release_id', selectedRelease)
      params.set('run_id', runId)
      params.set('test_type', runType)
      const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    },
    [selectedProject, selectedRelease]
  )

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Unable to Load Projects</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No Projects Available</h2>
          <p className="text-muted-foreground mb-6">
            Your account doesn't have any projects assigned yet. Please contact your administrator.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (!selectedProject || !selectedRelease) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={handleProjectChange}
        selectedRelease={selectedRelease}
        setSelectedRelease={handleReleaseChange}
        searchQuery={sidebarSearchQuery}
        setSearchQuery={setSidebarSearchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          project={selectedProject}
          projectName={selectedProjectName || undefined}
          release={selectedRelease}
          releaseName={selectedReleaseName || undefined}
          testType={testType}
          setTestType={handleTestTypeChange}
        />

        <main className="flex-1 overflow-auto p-6">
          {selectedReportId ? (
            <FullReportView
              reportId={selectedReportId}
              testType={selectedReportType}
              onClose={() => {
                setSelectedReportId(null)
                // Remove run_id from URL when closing
                if (selectedProject && selectedRelease) {
                  syncUrlParams(selectedProject, selectedRelease)
                }
              }}
            />
          ) : (
            <TestReportsGrid
              testType={testType}
              selectedProject={selectedProject}
              selectedRelease={selectedRelease}
              initialRunId={searchParams.get('run_id') ?? undefined}
              onReportSelect={(id, type) => {
                setSelectedReportId(id)
                setSelectedReportType(type)
                syncUrlParams(selectedProject, selectedRelease, id)
              }}
              onShareRun={handleShareRun}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <PageContent />
    </Suspense>
  )
}