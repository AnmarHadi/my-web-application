// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
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
import usersRoutes from "./routes/users.routes.js"; // ⬅️ جديد
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/document_system";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ✅ هذه صح
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// ✅ صحّحناها: كانت تشير إلى backend/backend/exports بالغلط
app.use("/exports", express.static(path.join(process.cwd(), "exports")));

// الراوترات
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
app.use("/api/users", usersRoutes); // ⬅️ جديد

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("DB connection error:", err));

mongoose.connection.on("error", (err) =>
  console.error("MongoDB connection error (event):", err)
);
