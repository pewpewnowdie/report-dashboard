'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { TestReportsGrid } from '@/components/test-reports-grid'
import { FullReportView } from '@/components/full-report-view'
import { getProjects } from '@/lib/api'

interface Project {
  key: string
  name: string
  releases: Array<{ key: string; name: string }>
}

export default function Page() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null)
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null)
  const [selectedReleaseName, setSelectedReleaseName] = useState<string | null>(null)
  const [testType, setTestType] = useState<'pytest' | 'load'>('pytest')
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [selectedReportType, setSelectedReportType] = useState<'pytest' | 'load'>('pytest')
  const [error, setError] = useState<string | null>(null)

  // Check auth and fetch projects
  useEffect(() => {
    const checkAuthAndFetchProjects = async () => {
      const token = localStorage.getItem('access_token')
      console.log('[PAGE] ===== INITIAL AUTH CHECK =====')
      console.log('[PAGE] Token exists:', !!token)
      
      if (!token) {
        console.log('[PAGE] No token found, redirecting to login')
        router.push('/login')
        return
      }

      try {
        console.log('[PAGE] Fetching projects from API...')
        const data = await getProjects()
        
        console.log('[PAGE] ===== PROJECTS FETCH RESULT =====')
        console.log('[PAGE] Raw data received:', data)
        console.log('[PAGE] Data type:', typeof data)
        console.log('[PAGE] Is array:', Array.isArray(data))
        console.log('[PAGE] Array length:', Array.isArray(data) ? data.length : 'N/A')
        
        if (Array.isArray(data)) {
          console.log('[PAGE] Valid array received')
          if (data.length > 0) {
            console.log('[PAGE] First project:', JSON.stringify(data[0], null, 2))
          }
        } else {
          console.log('[PAGE] ERROR: Data is not an array!', typeof data)
        }
        
        setProjects(data)
        
        // Set first project and release as default
        if (data.length > 0) {
          const firstProject = data[0]
          console.log('[PAGE] Setting first project:', firstProject.key, 'name:', firstProject.name)
          setSelectedProject(firstProject.key)
          setSelectedProjectName(firstProject.name)
          
          if (firstProject.releases && firstProject.releases.length > 0) {
            const firstRelease = firstProject.releases[0]
            console.log('[PAGE] Setting first release:', firstRelease.key, 'name:', firstRelease.name)
            setSelectedRelease(firstRelease.key)
            setSelectedReleaseName(firstRelease.name)
          } else {
            console.log('[PAGE] ERROR: First project has no releases!', firstProject)
            setError('First project has no releases')
          }
        } else {
          console.log('[PAGE] ERROR: No projects in array')
          setError('No projects returned from API')
        }
      } catch (error) {
        console.error('[PAGE] ===== FETCH ERROR =====')
        console.error('[PAGE] Error details:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setError(`Failed to fetch projects: ${errorMessage}`)
        
        // Don't redirect immediately, let user see the error
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } finally {
        console.log('[PAGE] Loading complete')
        setIsLoading(false)
      }
    }

    checkAuthAndFetchProjects()
  }, [router])

  // Log state changes for debugging
  useEffect(() => {
    console.log('[PAGE] State update:', {
      projectsCount: projects.length,
      selectedProject,
      selectedProjectName,
      selectedRelease,
      selectedReleaseName,
      isLoading,
      hasError: !!error,
    })
  }, [projects, selectedProject, selectedProjectName, selectedRelease, selectedReleaseName, isLoading, error])

  const handleTestTypeChange = (newType: 'automation' | 'load') => {
    setTestType(newType)
    setSelectedReportId(null)
  }

  const handleReleaseChange = (newRelease: string) => {
    setSelectedRelease(newRelease)
    
    // Find the release name from projects
    const project = projects.find(p => p.key === selectedProject)
    if (project) {
      const release = project.releases.find(r => r.key === newRelease)
      if (release) {
        setSelectedReleaseName(release.name)
      }
    }
    
    setSelectedReportId(null)
  }

  const handleProjectChange = (newProject: string) => {
    setSelectedProject(newProject)
    
    // Find the project name from projects
    const project = projects.find(p => p.key === newProject)
    if (project) {
      setSelectedProjectName(project.name)
      
      // Auto-select first release of new project
      if (project.releases && project.releases.length > 0) {
        const firstRelease = project.releases[0]
        setSelectedRelease(firstRelease.key)
        setSelectedReleaseName(firstRelease.name)
      }
    }
    
    setSelectedReportId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Error Loading Projects</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="bg-destructive/10 border border-destructive/30 rounded p-3 mb-4">
            <p className="text-sm text-destructive font-mono">Check browser console (F12) for detailed logs</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('access_token')
              router.push('/login')
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (!selectedProject || !selectedRelease) {
    console.log('[PAGE] ===== RENDER: NO PROJECT/RELEASE =====')
    console.log('[PAGE] selectedProject:', selectedProject)
    console.log('[PAGE] selectedRelease:', selectedRelease)
    console.log('[PAGE] projects.length:', projects.length)
    
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">No Projects Available</h2>
          <p className="text-muted-foreground mb-4">
            {!selectedProject && 'No project selected. '}
            {!selectedRelease && !selectedProject && 'No release selected.'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Projects loaded: {projects.length}
          </p>
          <div className="bg-secondary p-3 rounded mb-4 text-left max-h-40 overflow-auto">
            <p className="text-xs font-mono text-foreground">
              Open browser console (F12) to see detailed logs with [PAGE] prefix
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('access_token')
              router.push('/login')
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  console.log('[PAGE] ===== MAIN RENDER =====')
  console.log('[PAGE] Rendering with selectedProject:', selectedProject, 'selectedRelease:', selectedRelease)

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
              onClose={() => setSelectedReportId(null)}
            />
          ) : (
            <TestReportsGrid 
              testType={testType}
              selectedProject={selectedProject}
              selectedRelease={selectedRelease}
              onReportSelect={(id, type) => {
                setSelectedReportId(id)
                setSelectedReportType(type)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}