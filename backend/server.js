// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

// Routes
import contractorsRoutes from "./routes/contractors.routes.js";
import vehiclesRoutes from "./routes/vehicles.routes.js";
import driversRoutes from "./routes/drivers.routes.js";
import productsRoutes from "./routes/products.routes.js";
import locationsRoutes from "./routes/locations.routes.js";
import documentTypesRoutes from "./routes/documentTypes.routes.js";
import generalBalanceRoutes from "./routes/generalBalance.js";
import cashboxRoutes from "./routes/cashbox.js";
import transferPricesRoutes from "./routes/transfer-prices.routes.js";
import najafTransferPricesRouter from "./routes/najafTransferPrices.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import calculateTransferRoute from "./routes/calculate-transfer.route.js";
import telegramsAccessRoutes from "./routes/telegramsAccess.routes.js";
import unloadingRoutes from "./routes/unloading.routes.js";
import usersRoutes from "./routes/users.routes.js";

// DB connect helper (ESM)
import connectDB from "./db.js";

// ======== Env ========
dotenv.config();
const PORT = process.env.PORT || 5000;

// ======== Paths helpers ========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======== App ========
const app = express();

app.use(
  cors({
    origin: true, // جرّب فقط؛ لاحقًا ضع قائمة origins
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Static folders for uploads/exports relative to current working dir
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/exports", express.static(path.join(process.cwd(), "exports")));

// Health check
app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

// ======== API Routes ========
app.use("/api/contractors", contractorsRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/drivers", driversRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/document-types", documentTypesRoutes);
app.use("/api/general-balance", generalBalanceRoutes);
app.use("/api/cashbox", cashboxRoutes);
app.use("/api/transfer-prices", transferPricesRoutes);
app.use("/api/najaf-transfer-prices", najafTransferPricesRouter);
app.use("/api/documents", documentsRoutes);
app.use("/api/calculate-transfer", calculateTransferRoute);
app.use("/api/telegrams-access", telegramsAccessRoutes);
app.use("/api/unloading", unloadingRoutes);
app.use("/api/users", usersRoutes);

// ======== Serve frontend build if present (no reliance on NODE_ENV) ========
const distPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(distPath)) {
  console.log("🟢 Serving frontend from:", distPath);

  // خدمة الأصول (الجذر وأيضًا المسار الفرعي لو بقيت على base/basename)
  app.use(express.static(distPath));
  app.use("/my-web-application", express.static(distPath));

  // === SPA fallback كـ middleware نهائي (بدون أي pattern) ===
  app.use((req, res, next) => {
    // لا نتدخل في طلبات الـ API أو الملفات الثابتة
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/exports")
    ) {
      return next();
    }
    // نعيد index.html لأي GET آخر (يدعم الجذر والمسار الفرعي)
    if (req.method === "GET") {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    return next();
  });
} else {
  console.log("🟡 Frontend dist NOT found at:", distPath);
  console.log("   > نفّذ: npm run build داخل frontend ثم أعد تشغيل السيرفر");
}

// ======== Start server AFTER DB connect ========
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

// Optional: graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down...");
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
});
