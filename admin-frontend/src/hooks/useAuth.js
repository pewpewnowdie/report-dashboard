import { useState, useCallback } from "react";
import { authApi } from "../api";

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem("admin_token", data.access_token);
      setToken(data.access_token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken(null);
  }, []);

  return { token, isLoggedIn: !!token, login, logout, loading, error };
}
