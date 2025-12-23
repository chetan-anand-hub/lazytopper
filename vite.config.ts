import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// LazyTopper – Vite config
// Dev-time proxy:
//   Frontend can call /api/* (and /health) without worrying about ports/CORS.
//   Vite forwards those requests to the local AI gateway at http://localhost:3001.
//
// Usage in frontend code (recommended):
//   fetch("/api/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(...) })

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Main API endpoints
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Convenience: allow hitting /health from the frontend origin as well
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
