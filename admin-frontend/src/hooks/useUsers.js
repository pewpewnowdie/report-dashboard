import { useState, useEffect, useCallback } from "react";
import { usersApi } from "../api";

export function useUsers(enabled = true) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(await usersApi.getAll()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (enabled) load(); }, [enabled, load]);

  return { users, loading, error, reload: load };
}
