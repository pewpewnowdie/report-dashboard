import React, { useState } from "react";
import Navbar from "./components/layout/Navbar";
import Toast from "./components/layout/Toast";
import ErrorBanner from "./components/layout/ErrorBanner";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import UsersPage from "./pages/UsersPage";
import ReleasesPage from "./pages/ReleasesPage";
import { useAuth } from "./hooks/useAuth";
import { useProjects } from "./hooks/useProjects";
import { useUsers } from "./hooks/useUsers";
import { useReleases } from "./hooks/useReleases";
import { useToast } from "./hooks/useToast";

export default function App() {
  const { isLoggedIn, login, logout, loading: authLoading, error: authError } = useAuth();
  const [view, setView] = useState("projects");

  const { projects, projectUsers, loading: pLoading, error: pError, reload: reloadProjects, loadUsers, createProject, addUser, removeUser, deleteProject } = useProjects(isLoggedIn);
  const { users, loading: uLoading, error: uError, reload: reloadUsers } = useUsers(isLoggedIn);
  const { releases, loadForProject, loadForAll, createRelease, deleteRelease } = useReleases();
  const { toast, showToast } = useToast();

  const loading = pLoading || uLoading;
  const error   = pError   || uError;

  // ── Not logged in → show login page ──────────────────────
  if (!isLoggedIn) {
    return <LoginPage onLogin={login} loading={authLoading} error={authError} />;
  }

  // ── Logged in → show dashboard ───────────────────────────
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 14, color: "#111", background: "#f3f4f6", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; vertical-align: middle; }
        th { background: #f9fafb; font-weight: 600; }
        tr:hover td { background: #f9fafb; }
        input, select, textarea { font-family: Arial, sans-serif; font-size: 14px; border: 1px solid #d1d5db; border-radius: 4px; padding: 7px 10px; width: 100%; outline: none; }
        input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
        .link { color: #2563eb; cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; font-size: 14px; font-family: Arial, sans-serif; }
        .link-red { color: #dc2626; cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; font-size: 14px; font-family: Arial, sans-serif; }
      `}</style>

      <Navbar view={view} onNavigate={setView} loading={loading} onLogout={logout} />

      <div style={{ padding: 24 }}>
        <ErrorBanner error={error} onRetry={() => { reloadProjects(); reloadUsers(); }} />

        {view === "projects" && (
          <ProjectsPage
            projects={projects}
            projectUsers={projectUsers}
            releases={releases}
            users={users}
            loadUsers={loadUsers}
            loadReleases={loadForProject}
            createProject={createProject}
            deleteProject={deleteProject}
            addUser={addUser}
            removeUser={removeUser}
            createRelease={createRelease}
            deleteRelease={deleteRelease}
            showToast={showToast}
          />
        )}

        {view === "users" && (
          <UsersPage
            users={users}
            projects={projects}
            projectUsers={projectUsers}
            loadProjectUsers={loadUsers}
            removeUser={removeUser}
            showToast={showToast}
          />
        )}

        {view === "releases" && (
          <ReleasesPage
            projects={projects}
            releases={releases}
            loadForAll={loadForAll}
          />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
