import { api } from "./client";

// Auth — hits /auth/* directly (not /admin/*)
export const authApi = {
  login: async (username, password) => {
    const r = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || r.statusText);
    if (data.role && data.role !== "admin") throw new Error("Admin access only.");
    return data;
  },
};

export const projectsApi = {
  getAll:     ()                        => api.get("/projects"),
  create:     (project_key, name)       => api.post("/projects", { project_key, name }),
  getUsers:   (project_key)             => api.get(`/projects/${project_key}/users`),
  addUser:    (project_key, username)   => api.post("/projects/users",   { project_key, username }),
  removeUser: (project_key, username)   => api.delete("/projects/users", { project_key, username }),
};

export const releasesApi = {
  getByProject: (project_key)       => api.get(`/releases?project=${project_key}`),
  create:       (project_key, name) => api.post("/releases", { project_key, name }),
  getRuns:      (release_id)        => api.get(`/releases/${release_id}`),
};

export const usersApi = {
  getAll:     ()        => api.get("/users"),
  getRuns:    (user_id) => api.get(`/users/${user_id}/runs`),
  getProjects:(user_id) => api.get(`/users/${user_id}/projects`),
};