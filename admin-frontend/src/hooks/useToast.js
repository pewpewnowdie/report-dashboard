import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null); // { msg, isError }

  const show = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast: show };
}
