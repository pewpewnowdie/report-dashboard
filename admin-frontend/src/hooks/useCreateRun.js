import { useState, useCallback } from "react";

const BASE_URL = "/admin";

async function uploadRun(endpoint, formData) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: do NOT set Content-Type here; browser sets it with boundary for multipart
    },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.reload();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }

  return res.json();
}

export function useCreateRun() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const createPytestRun = useCallback(async ({ json_file, report_zip, run_name, project_key, release_name, sprint_no }) => {
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("json_file", json_file);
      fd.append("report_zip", report_zip);
      fd.append("run_name", run_name);
      fd.append("project_key", project_key);
      fd.append("release_name", release_name);
      fd.append("sprint_no", sprint_no);
      return await uploadRun("/pytest_runs", fd);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRobotRun = useCallback(async ({ xml_file, images, run_name, project_key, release_name, sprint_no }) => {
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("xml_file", xml_file);
      fd.append("images", images);
      fd.append("run_name", run_name);
      fd.append("project_key", project_key);
      fd.append("release_name", release_name);
      fd.append("sprint_no", sprint_no);
      return await uploadRun("/robot_runs", fd);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const createJmeterRun = useCallback(async ({ jmx, jtl, log, run_name, project_key, release_name, sprint_no }) => {
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("jmx", jmx);
      fd.append("jtl", jtl);
      fd.append("log", log);
      fd.append("run_name", run_name);
      fd.append("project_key", project_key);
      fd.append("release_name", release_name);
      fd.append("sprint_no", sprint_no);
      return await uploadRun("/jmeter_runs", fd);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, createPytestRun, createRobotRun, createJmeterRun };
}
