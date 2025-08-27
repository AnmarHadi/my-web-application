// backend/models/Location.model.js
import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name: { type: String, required: true },         // اسم الموقع
  province: { type: String, required: true },     // المحافظة
  operationType: { type: String, enum: ["تحميل", "تفريغ"], required: true }, // نوع العملية
}, { timestamps: true });

export default mongoose.model("Location", schema);
