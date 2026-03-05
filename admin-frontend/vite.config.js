import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Main website base URL — override with VITE_MAIN_APP_URL env var
    __MAIN_APP_URL__: JSON.stringify(process.env.VITE_MAIN_APP_URL || "http://localhost:3000"),
  },
  server: {
    port: 3000,
    proxy: {
      "/admin": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
