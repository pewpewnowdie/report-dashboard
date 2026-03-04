import { useState, useCallback } from "react";
import { releasesApi } from "../api";

export function useReleases() {
  const [releases, setReleases] = useState({}); // { project_key: Release[] }

  const loadForProject = useCallback(async (project_key) => {
    if (releases[project_key]) return;
    try {
      const data = await releasesApi.getByProject(project_key);
      setReleases(prev => ({ ...prev, [project_key]: data }));
    } catch (e) {
      throw e;
    }
  }, [releases]);

  const loadForAll = useCallback(async (projects) => {
    for (const p of projects) {
      if (!releases[p.project_key]) {
        try {
          const data = await releasesApi.getByProject(p.project_key);
          setReleases(prev => ({ ...prev, [p.project_key]: data }));
        } catch (_) {}
      }
    }
  }, [releases]);

  const createRelease = useCallback(async (project_key, name) => {
    const r = await releasesApi.create(project_key, name);
    setReleases(prev => ({
      ...prev,
      [project_key]: [r, ...(prev[project_key] || [])],
    }));
    return r;
  }, []);

  return { releases, loadForProject, loadForAll, createRelease };
}
