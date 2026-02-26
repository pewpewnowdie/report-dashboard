'use client'

import { useState, useEffect } from 'react'
import { Download, FileDown, Copy, Check, AlertCircle } from 'lucide-react'
import { getApplications } from '@/lib/api'

interface AppVersion {
  version: string
  date: string
  changes: string[]
  filename: string
  size: string
  download_url: string
}

interface App {
  id: string
  name: string
  fullName: string
  description: string
  icon: string
  color: string
  versions: AppVersion[]
}

export default function DownloadsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null)

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await getApplications()
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications')
        }

        const data = await response.json()
        console.log('[Downloads] Applications loaded:', data)
        setApps(data)
        
        // Set first app as active on mobile
        if (data.length > 0) {
          setActiveTab(data[0].id)
        }
      } catch (err) {
        console.error('[Downloads] Failed to load apps:', err)
        setError('Failed to load applications. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApps()
  }, [])

  const handleDownload = (downloadUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyUrl = (downloadUrl: string, version: string) => {
    const textArea = document.createElement("textarea")
    textArea.value = downloadUrl
    textArea.style.position = "fixed"
    textArea.style.top = "0"
    textArea.style.left = "0"
    textArea.style.opacity = "0"

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    document.execCommand("copy")

    document.body.removeChild(textArea)
    setCopiedVersion(version)
    setTimeout(() => setCopiedVersion(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Error Loading Applications</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FileDown className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Downloads</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Download the latest versions of our testing tools
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* App Selector (Mobile/Tablet) */}
        <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveTab(activeTab === app.id ? null : app.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === app.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {app.name}
            </button>
          ))}
        </div>

        {/* Desktop: Show All, Mobile: Show Selected */}
        {apps.length > 0 ? (
          <>
            <div className="hidden lg:block space-y-8">
              {apps.map((app) => (
                <AppSection key={app.id} app={app} onDownload={handleDownload} onCopy={handleCopyUrl} copiedVersion={copiedVersion} />
              ))}
            </div>

            {/* Mobile: Show Selected */}
            <div className="lg:hidden space-y-8">
              {apps.filter((app) => activeTab === null || activeTab === app.id).map((app) => (
                <AppSection key={app.id} app={app} onDownload={handleDownload} onCopy={handleCopyUrl} copiedVersion={copiedVersion} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No applications available</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AppSection({ 
  app, 
  onDownload, 
  onCopy, 
  copiedVersion 
}: { 
  app: App
  onDownload: (url: string, filename: string) => void
  onCopy: (url: string, version: string) => void
  copiedVersion: string | null
}) {
  const [expandedVersion, setExpandedVersion] = useState(app.versions.length > 0)

  if (!app.versions || app.versions.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      {/* App Header */}
      <div className={`bg-gradient-to-r ${app.color} rounded-t-lg p-6 text-white`}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{app.fullName}</h2>
            <p className="text-white/90">{app.description}</p>
          </div>
        </div>
      </div>

      {/* Versions */}
      <div className="bg-card border border-t-0 border-border rounded-b-lg p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Available Versions</h3>
        
        {/* Latest Version (Highlighted) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-white bg-green-600 px-3 py-1 rounded-full">
              LATEST
            </span>
            <p className="text-sm text-muted-foreground">Recommended for most users</p>
          </div>
          <VersionCard 
            version={app.versions[0]} 
            onDownload={onDownload}
            onCopy={onCopy}
            isCopied={copiedVersion === app.versions[0].version}
          />
        </div>

        {/* Previous Versions */}
        {app.versions.length > 1 && (
          <div>
            <button
              onClick={() => setExpandedVersion(!expandedVersion)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-3"
            >
              <span>
                {expandedVersion ? '−' : '+'}
              </span>
              Previous Versions ({app.versions.length - 1})
            </button>

            {expandedVersion && (
              <div className="space-y-3 pl-4 border-l-2 border-border">
                {app.versions.slice(1).map((version) => (
                  <VersionCard 
                    key={version.version}
                    version={version}
                    onDownload={onDownload}
                    onCopy={onCopy}
                    isCopied={copiedVersion === version.version}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function VersionCard({ 
  version, 
  onDownload, 
  onCopy, 
  isCopied 
}: { 
  version: AppVersion
  onDownload: (url: string, filename: string) => void
  onCopy: (url: string, version: string) => void
  isCopied: boolean
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:bg-secondary transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-bold text-foreground">v{version.version}</h4>
          <p className="text-xs text-muted-foreground">Released {version.date}</p>
        </div>
        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
          {version.size}
        </span>
      </div>

      {/* Changes */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-foreground mb-2">What's new:</p>
        <ul className="space-y-1">
          {version.changes.map((change, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{change}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(version.download_url, version.filename)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={() => onCopy(version.download_url, version.version)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          title="Copy download URL"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}