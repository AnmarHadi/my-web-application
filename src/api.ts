// src/api.ts
import axios from "axios";

// في التطوير: Vite proxy سيحوّل /api إلى http://localhost:5000
// في الإنتاج: استخدم نفس الأصل (القيمة النسبية تعمل مع السيرفر الذي يقدّم الواجهة)
const api = axios.create({
  baseURL: "/api",
});

export default api;
