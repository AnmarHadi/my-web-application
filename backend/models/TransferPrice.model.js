import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    operationType: { type: String, required: true }, // تحميل أو تفريغ
    province:      { type: String, required: true },
    locationId:    { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    paymentType:   { type: String, required: true }, // مقطوعة/باللتر/بالكغم (قديمة: "بالطن")
    price:         { type: Number, required: true },
    advance:       { type: Number, default: 0 },
    // عند "تحميل" نخزن المنتج (اختياري)
    productId:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  },
  { timestamps: true }  // ← جديد
);

export default mongoose.model("TransferPrice", schema);

