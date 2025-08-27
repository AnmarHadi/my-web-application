// backend/models/CashBoxTransaction.model.js
import mongoose from "mongoose";

const schema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  details:   { type: String, required: true },
  type:      { type: String, enum: ["add", "withdraw"], default: "add" },
  documentId: { type: String, default: null }, // تغيير من ObjectId إلى String
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("CashBoxTransaction", schema);