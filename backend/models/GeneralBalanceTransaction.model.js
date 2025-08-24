// backend/models/GeneralBalanceTransaction.model.js
import mongoose from "mongoose";
const schema = new mongoose.Schema({
  amount:    { type: Number, required: true },      // المبلغ المضاف أو المسحوب (دائمًا موجب)
  details:   { type: String, required: true },
  type:      { type: String, enum: ["add", "withdraw"], default: "add" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("GeneralBalanceTransaction", schema);
