// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // REST‑API الرئيسة
      "/api": "http://localhost:5000",

      // روابط الصور المرفوعة
      "/uploads": "http://localhost:5000",

      // خادم السكنر (scan_server.py)
      "/scan": {
        target: "http://127.0.0.1:5123",
        changeOrigin: true,   // يضيف Host مناسب للهدف
        secure: false,        // يتجاهل https self‑signed لو وُجد
      },
    },
  },
});
