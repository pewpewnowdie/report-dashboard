"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { Project, Release } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject?: string;
  selectedRelease?: string;
  onSelect: (projectKey: string, releaseKey: string) => void;
}

export function ProjectSidebar({
  projects,
  selectedProject,
  selectedRelease,
  onSelect,
}: ProjectSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.key))
  );

  const toggleProject = (projectKey: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectKey)) {
      newExpanded.delete(projectKey);
    } else {
      newExpanded.add(projectKey);
    }
    setExpandedProjects(newExpanded);
  };

  return (
    <aside className="w-80 border-r border-border bg-sidebar overflow-y-auto h-screen flex flex-col">
      <div className="sticky top-0 bg-sidebar border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Projects</h2>
        <p className="text-xs text-muted-foreground mt-1">Select a release to view reports</p>
      </div>

      <nav className="p-4 space-y-1">
        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.key);
          const reportCount = project.releases.reduce(
            (acc, r) => acc + (r.jmeterReports?.length || 0) + (r.pytestReports?.length || 0),
            0
          );

          return (
            <div key={project.key}>
              <button
                onClick={() => toggleProject(project.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  selectedProject === project.key
                    ? "bg-accent/60 text-foreground"
                    : "text-sidebar-foreground"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{project.name}</span>
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  {project.releases.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {project.releases.map((release) => {
                    const isSelected =
                      selectedProject === project.key && selectedRelease === release.key;
                    const releaseReportCount =
                      (release.jmeterReports?.length || 0) + (release.pytestReports?.length || 0);

                    return (
                      <button
                        key={release.key}
                        onClick={() => onSelect(project.key, release.key)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-muted-foreground"
                        )}
                      >
                        <span className="text-[10px] flex-shrink-0">●</span>
                        <span className="flex-1 text-left truncate">{release.name}</span>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded flex-shrink-0",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {releaseReportCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
