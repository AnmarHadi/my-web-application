// backend/routes/calculate-transfer.route.js
import express from "express";
import TransferPrice from "../models/TransferPrice.model.js";
const router = express.Router();

/**
 * حساب المبالغ النهائية للنقلة
 * يطلب:
 *   - operationType: تحميل أو تفريغ
 *   - province: المحافظة
 *   - locationId: معرف الوجهة
 *   - paymentType: مقطوعة/باللتر/بالطن
 *   - quantity: الكمية (اختياري إذا كان الدفع بالقطعة)
 *   - extraAmount: مبلغ إضافي (اختياري)
 *   - discountAmount: مبلغ خصم (اختياري)
 */
router.post("/", async (req, res) => {
  try {
    const { operationType, province, locationId, paymentType, quantity, extraAmount, discountAmount } = req.body;
    if (!operationType || !province || !locationId || !paymentType) {
      return res.status(400).json({ error: "بيانات غير مكتملة" });
    }
    // جلب سعر النقلة الصحيح
    const priceRow = await TransferPrice.findOne({ operationType, province, locationId, paymentType });
    if (!priceRow) {
      return res.status(404).json({ error: "لم يتم العثور على سعر النقلة لهذا الخيار" });
    }
    let total = 0;
    let advance = priceRow.advance || 0;
    if (paymentType === "مقطوعة") {
      total = priceRow.price;
    } else if (paymentType === "باللتر" || paymentType === "بالطن") {
      total = priceRow.price * (Number(quantity) || 1);
    }
    total = total + (Number(extraAmount) || 0) - (Number(discountAmount) || 0);
    res.json({
      total,
      advance,
      remaining: total - advance
    });
  } catch (err) {
    res.status(500).json({ error: "فشل في حساب النقلة" });
  }
});

export default router;
