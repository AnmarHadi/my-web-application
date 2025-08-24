import express from "express";
import GeneralBalanceTransaction from "../models/GeneralBalanceTransaction.model.js";
const router = express.Router();

// جلب كل الحركات
router.get("/", async (req, res) => {
  try {
    const data = await GeneralBalanceTransaction.find().sort({ createdAt: 1 });
    res.json(data.map(row => ({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      createdAt: row.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب البيانات" });
  }
});

// إضافة حركة جديدة
router.post("/", async (req, res) => {
  try {
    let amount = Number(req.body.amount);
    const details = req.body.details;
    const type = req.body.type;
    if (!amount || isNaN(amount) || !details || !type)
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });

    amount = Math.abs(amount); // المبلغ يجب أن يكون موجب دائماً

    const row = await GeneralBalanceTransaction.create({ amount, details, type });
    res.status(201).json({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      createdAt: row.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "فشل في الإضافة" });
  }
});

// تعديل حركة
router.put("/:id", async (req, res) => {
  try {
    let amount = Number(req.body.amount);
    const details = req.body.details;
    const type = req.body.type;
    if (!amount || isNaN(amount) || !details || !type)
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });

    amount = Math.abs(amount); // المبلغ يجب أن يكون موجب دائماً

    const row = await GeneralBalanceTransaction.findByIdAndUpdate(
      req.params.id,
      { amount, details, type },
      { new: true }
    );
    if (!row) return res.status(404).json({ error: "غير موجود" });
    res.json({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      createdAt: row.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "فشل في التعديل" });
  }
});

// حذف
router.delete("/:id", async (req, res) => {
  try {
    const row = await GeneralBalanceTransaction.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ error: "غير موجود" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "فشل في الحذف" });
  }
});

export default router;
