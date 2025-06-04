import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg"],
  resolve: {
    alias: {
      "@assets": "/src/assets",
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/verify-email": {
        target: "http://localhost:3000/api/auth",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/verify-email/, "/verify-email"),
      },
    },
  },
});
