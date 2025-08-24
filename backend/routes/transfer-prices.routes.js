import express from "express";
import TransferPrice from "../models/TransferPrice.model.js";

const router = express.Router();

// GET - جلب الأسعار مع فلاتر، ومرونة في مطابقة "بالكغم" مع "بالطن"
router.get("/", async (req, res) => {
  try {
    const { province, locationId, operationType, paymentType } = req.query;

    // تطبيع نوع الدفع الوارد من الواجهة
    const normPay = (pt) => (pt === "بالطن" ? "بالكغم" : pt);
    const wantPT = paymentType ? normPay(String(paymentType)) : null;

    // فلتر أساسي
    const base = {};
    if (province)      base.province      = province;
    if (locationId)    base.locationId    = locationId;
    if (operationType) base.operationType = operationType;

    // مطابقة مرنة لنوع الدفع
    if (wantPT) {
      if (wantPT === "بالكغم") {
        // لو طلب "بالكغم" طابق الاثنين: "بالكغم" و"بالطن" (للبيانات القديمة)
        base.paymentType = { $in: ["بالكغم", "بالطن"] };
      } else {
        base.paymentType = wantPT; // "باللتر" أو "مقطوعة"
      }
    }

    const queryWith = async (filter) =>
      TransferPrice.find(filter)
        .sort({ createdAt: -1, _id: -1 })     // الأحدث أولًا
        .populate("locationId", "name province")
        .populate("productId", "name");

    // المحاولة 1: بكل الفلاتر
    let rows = await queryWith(base);

    // المحاولة 2: إن لم نجد ومعك operationType، جرّب بدون operationType
    if (!rows.length && operationType) {
      const { operationType: _omit, ...less } = base;
      rows = await queryWith(less);
    }

    // تجهيز النتائج
    const result = rows.map((p) => ({
      id: p._id,
      operationType: p.operationType,
      province: p.province,
      locationId: p.locationId?._id,
      locationName: p.locationId?.name || "",
      paymentType: p.paymentType === "بالطن" ? "بالكغم" : p.paymentType, // عرض موحّد
      price: p.price,
      advance: p.advance ?? 0,
      productId: p.productId?._id || null,
      productName: p.productId?.name || null,
    }));

    res.json(result);
  } catch (err) {
    console.error("transfer-prices get error:", err);
    res.status(500).json({ error: "فشل في جلب الأسعار" });
  }
});

export default router;
