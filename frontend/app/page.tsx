'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function Page() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null)
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null)
  const [selectedReleaseName, setSelectedReleaseName] = useState<string | null>(null)
  const [testType, setTestType] = useState<'automation' | 'load'>('automation')
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [selectedReportType, setSelectedReportType] = useState<'automation' | 'load'>('automation')
  const [error, setError] = useState<string | null>(null)

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
        
        // Set first project and release as default
        if (data.length > 0) {
          const firstProject = data[0]
          setSelectedProject(firstProject.key)
          setSelectedProjectName(firstProject.name)
          
          if (firstProject.releases && firstProject.releases.length > 0) {
            const firstRelease = firstProject.releases[0]
            setSelectedRelease(firstRelease.key)
            setSelectedReleaseName(firstRelease.name)
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
  }, [router])

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