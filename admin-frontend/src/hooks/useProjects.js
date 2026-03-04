import { useState, useEffect, useCallback } from "react";
import { projectsApi } from "../api";

export function useProjects(enabled = true) {
  const [projects, setProjects]         = useState([]);
  const [projectUsers, setProjectUsers] = useState({});
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setProjects(await projectsApi.getAll()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async (project_key) => {
    const data = await projectsApi.getUsers(project_key);
    setProjectUsers(prev => ({ ...prev, [project_key]: data }));
  }, []);

  const createProject = useCallback(async (project_key, name) => {
    const p = await projectsApi.create(project_key, name);
    setProjects(prev => [...prev, p]);
    return p;
  }, []);

  const addUser = useCallback(async (project_key, username) => {
    await projectsApi.addUser(project_key, username);
    await loadUsers(project_key);
  }, [loadUsers]);

  const removeUser = useCallback(async (project_key, username) => {
    await projectsApi.removeUser(project_key, username);
    setProjectUsers(prev => ({
      ...prev,
      [project_key]: (prev[project_key] || []).filter(u => u.username !== username),
    }));
  }, []);

  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  return { projects, projectUsers, loading, error, reload: load, loadUsers, createProject, addUser, removeUser };
}
