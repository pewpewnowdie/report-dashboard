import { useState, useCallback } from "react";
import { api } from "../api/client";

export function useProjectSettings() {
  const [settings, setSettings] = useState({});   // keyed by project_key
  const [loading, setLoading]   = useState({});
  const [error, setError]       = useState({});

  const load = useCallback(async (project_key) => {
    setLoading(prev => ({ ...prev, [project_key]: true }));
    setError(prev => ({ ...prev, [project_key]: null }));
    try {
      const data = await api.get(`/project_settings/${project_key}`);
      setSettings(prev => ({ ...prev, [project_key]: data }));
    } catch (e) {
      // 404 means no settings exist yet — that's fine
      if (!e.message?.includes("404") && !e.message?.toLowerCase().includes("not found")) {
        setError(prev => ({ ...prev, [project_key]: e.message }));
      }
      setSettings(prev => ({ ...prev, [project_key]: null }));
    } finally {
      setLoading(prev => ({ ...prev, [project_key]: false }));
    }
  }, []);

  const save = useCallback(async (project_key, active_release_name, completed_sprints, exists) => {
    const body = { project_key, active_release_name, completed_sprints };
    const data = exists
      ? await api.put("/project_settings", body)
      : await api.post("/project_settings", body);
    setSettings(prev => ({ ...prev, [project_key]: data }));
    return data;
  }, []);

  return { settings, loading, error, load, save };
}