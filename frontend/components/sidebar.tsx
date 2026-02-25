import { ChevronRight, Search, FolderOpen, LogOut } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  key: string
  name: string
  releases: Array<{ key: string; name: string }>
}

interface SidebarProps {
  projects: Project[]
  selectedProject: string
  setSelectedProject: (id: string) => void
  selectedRelease: string
  setSelectedRelease: (id: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function Sidebar({
  projects,
  selectedProject,
  setSelectedProject,
  selectedRelease,
  setSelectedRelease,
  searchQuery,
  setSearchQuery,
}: SidebarProps) {
  const router = useRouter()
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set([selectedProject])
  )

  console.log('[v0] Sidebar received projects:', projects)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects

    const query = searchQuery.toLowerCase()
    return projects.map((project) => ({
      ...project,
      releases: project.releases.filter((r) =>
        r.name.toLowerCase().includes(query)
      ),
    })).filter(
      (p) =>
        p.name.toLowerCase().includes(query) || p.releases.length > 0
    )
  }, [searchQuery, projects])

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Test Reports</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-sidebar-accent border border-sidebar-border rounded text-sm text-sidebar-foreground placeholder-sidebar-foreground/50 focus:outline-none focus:border-sidebar-primary"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Projects Section */}
        <div className="px-4 py-4">
          <div className="space-y-2">
            {filteredProjects.map((project) => {
              const isExpanded = expandedProjects.has(project.key)
              return (
                <div key={project.key}>
                  <button
                    onClick={() => toggleProject(project.key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-4 h-4 text-sidebar-foreground/70 transition-transform ${
                          isExpanded ? 'transform rotate-90' : 'transform rotate-0'
                        }`}
                      />
                      <FolderOpen className="w-4 h-4 text-sidebar-primary" />
                      <span className="font-medium">{project.name}</span>
                    </div>
                  </button>

                  {/* Releases - Tree Structure */}
                  {isExpanded && (
                    <div className="ml-2 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                      {project.releases.map((release) => (
                        <button
                          key={release.key}
                          onClick={() => {
                            setSelectedProject(project.key)
                            setSelectedRelease(release.key)
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            selectedProject === project.key &&
                            selectedRelease === release.key
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
                          }`}
                        >
                          {release.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
