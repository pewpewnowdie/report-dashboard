import { RefreshCw, Download } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  project: string
  projectName?: string
  release: string
  releaseName?: string
  testType: 'pytest' | 'load'
  setTestType: (type: 'pytest' | 'load') => void
}

export function Header({ 
  project, 
  projectName,
  release,
  releaseName,
  testType, 
  setTestType 
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Trigger a page refresh or data reload
      window.location.reload()
    } catch (error) {
      console.error('[Header] Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDownloadRedirect = () => {
    router.push('/downloads')
  }

  // Use provided names, fall back to keys
  const displayProjectName = projectName || project
  const displayReleaseName = releaseName || release

  return (
    <header className="border-b border-border bg-card">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {displayProjectName} - {displayReleaseName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Test Reports & Analytics</p>
          </div>
          <div>
            <button 
              onClick={handleDownloadRedirect}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Downloads"
            >
              <Download className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>

            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw 
                className={`w-5 h-5 text-muted-foreground hover:text-foreground ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Test Type Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestType('pytest')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              testType === 'pytest'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            PyTest
          </button>
          <button
            onClick={() => setTestType('load')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              testType === 'load'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            Load Tests
          </button>
        </div>
      </div>
    </header>
  )
}