// backend/models/Document.model.js
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  operationType: { type: String, required: true }, // تحميل أو تفريغ
  documentType: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentType", required: true },
  letter: { type: String, required: true },
  number: { type: String, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  province: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  unit: { type: String, required: true }, // لتر أو كغم
  quantity: { type: Number, required: true },
  addAmount: { type: Number, default: 0 },
  addAmountDetail: { type: String, default: "" },
  deductAmount: { type: Number, default: 0 },
  deductAmountDetail: { type: String, default: "" },
  total: { type: Number, required: true },
  advance: { type: Number, required: true },
  paymentType: { type: String, required: true }, // مقطوعة، باللتر، بالكغم
  createdAt: { type: Date, default: Date.now },

  // ↓↓↓ حقول التفريغ ↓↓↓
  isUnloaded: { type: Boolean, default: false },
  unloadQuantity: { type: Number, default: null },
  unloadDate: { type: Date, default: null },
  finalTotal: { type: Number, default: 0 }, // المبلغ النهائي عند التسعير بالوحدة
});

documentSchema.index({ createdAt: -1 });

export default mongoose.model("Document", documentSchema);
