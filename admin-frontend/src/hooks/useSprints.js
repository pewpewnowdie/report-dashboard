import { useState, useCallback } from "react";
import { api } from "../api/client";

export function useSprints() {
  // sprints keyed by `${project_key}::${release}`
  const [sprints, setSprints]   = useState({});
  const [loading, setLoading]   = useState({});
  const [error, setError]       = useState({});

  const cacheKey = (project_key, release) => `${project_key}::${release}`;

  const load = useCallback(async (project_key, release) => {
    if (!project_key || !release) return;
    const key = cacheKey(project_key, release);
    setLoading(prev => ({ ...prev, [key]: true }));
    setError(prev => ({ ...prev, [key]: null }));
    try {
      const data = await api.post("/sprints", { project_key, release });
      setSprints(prev => ({ ...prev, [key]: data }));
    } catch (e) {
      setError(prev => ({ ...prev, [key]: e.message }));
      setSprints(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  const updateTestCaseCount = useCallback(async (project_key, release, sprint_no, test_case_count) => {
    await api.put("/update_sprint", { project_key, release, sprint_no, test_case_count });
    // Optimistically update local state
    const key = cacheKey(project_key, release);
    setSprints(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(s =>
        s.sprint_no === sprint_no ? { ...s, test_case_count } : s
      ),
    }));
  }, []);

  return { sprints, loading, error, load, updateTestCaseCount, cacheKey };
}