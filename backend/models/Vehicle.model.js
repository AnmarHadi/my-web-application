// backend/models/Vehicle.model.js
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  province: String,
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: "Contractor" },

  // حقول مضافة
  wheelType: String,     // نوع العجلة
  ownerName: String,     // اسم المالك
  ownerAddress: String,  // العنوان (إن رغبت بعرضه لاحقاً)

  annualEnd: String,
  annualImage: String,
  checkupEnd: String,
  checkupImage: String,
}, { timestamps: true });

export default mongoose.model("Vehicle", vehicleSchema);
