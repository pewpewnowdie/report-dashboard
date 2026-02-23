"use client";

import { useState } from "react";
import { Project, Release } from "@/lib/mock-data";
import { ProjectSidebar } from "./project-sidebar";
import { ReportTabs } from "./report-tabs";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface DashboardLayoutProps {
  projects: Project[];
}

export function DashboardLayout({ projects }: DashboardLayoutProps) {
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [selectedRelease, setSelectedRelease] = useState<string | undefined>();

  const handleSelect = (projectKey: string, releaseKey: string) => {
    setSelectedProject(projectKey);
    setSelectedRelease(releaseKey);
  };

  // Get the selected release data
  let releaseData: Release | undefined;
  if (selectedProject && selectedRelease) {
    const project = projects.find((p) => p.key === selectedProject);
    releaseData = project?.releases.find((r) => r.key === selectedRelease);
  }

  return (
    <div className="flex h-screen bg-background">
      <ProjectSidebar
        projects={projects}
        selectedProject={selectedProject}
        selectedRelease={selectedRelease}
        onSelect={handleSelect}
      />

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 z-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Load Test Dashboard
            </h1>
            {selectedProject && selectedRelease && releaseData && (
              <p className="text-sm text-muted-foreground mt-1">
                {projects.find((p) => p.key === selectedProject)?.name} ·{" "}
                {selectedRelease}
              </p>
            )}
          </div>
        </div>

        <div className="p-6">
          {!selectedProject || !selectedRelease ? (
            <div className="flex items-center justify-center h-96">
              <Card className="p-8 max-w-md w-full border-border bg-card">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">
                    Select a Release
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a project and release from the sidebar to view test
                    reports and metrics.
                  </p>
                </div>
              </Card>
            </div>
          ) : releaseData ? (
            <ReportTabs
              jmeterReports={releaseData.jmeterReports}
              pytestReports={releaseData.pytestReports}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <Card className="p-8 max-w-md w-full border-border bg-card">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">
                    Release Not Found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The selected release could not be found. Please select
                    another one.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
