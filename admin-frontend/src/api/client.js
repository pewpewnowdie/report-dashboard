const BASE_URL = "/admin";

const request = async (path, options = {}) => {
  const token = localStorage.getItem("admin_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid — clear and force re-login
    localStorage.removeItem("admin_token");
    window.location.reload();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }

  return res.json();
};

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: "POST",   body }),
  put:    (path, body) => request(path, { method: "PUT",    body }),
  delete: (path, body) => request(path, { method: "DELETE", body }),
  patch:  (path, body) => request(path, { method: "PATCH",  body }),
};