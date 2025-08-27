// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ⚠️ إبقه فقط إذا كنت تنشر على GitHub Pages ضمن مسار /my-web-application/
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
      "/health": "http://localhost:5000", // ⬅️ مهم لفحص الصحة من الواجهة
      "/scan": {
        target: "http://127.0.0.1:5123",
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, def) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" && String(warning.message).includes('"use client"')) return;
        def(warning);
      }
    }
  }
});
