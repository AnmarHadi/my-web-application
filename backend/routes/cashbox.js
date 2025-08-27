// backend/routes/cashbox.js
import express from "express";
import CashBoxTransaction from "../models/CashBoxTransaction.model.js";

const router = express.Router();

// مسار لجلب جميع الحركات
router.get("/", async (req, res) => {
  try {
    const data = await CashBoxTransaction.find().sort({ createdAt: 1 });
    res.json(data.map(row => ({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      documentId: row.documentId,
      createdAt: row.createdAt,
    })));
  } catch (err) {
    console.error("Error in cashbox GET:", err);
    res.status(500).json({ error: "فشل في جلب البيانات" });
  }
});

// مسار لإضافة حركة جديدة
router.post("/", async (req, res) => {
  try {
    let amount = Number(req.body.amount);
    const details = req.body.details;
    const type = req.body.type;
    const documentId = req.body.documentId || null;
    
    if (!amount || isNaN(amount) || !details || !type) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    
    amount = Math.abs(amount);
    
    const row = await CashBoxTransaction.create({ amount, details, type, documentId });
    res.status(201).json({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      documentId: row.documentId,
      createdAt: row.createdAt,
    });
  } catch (err) {
    console.error("Error in cashbox POST:", err);
    res.status(500).json({ error: "فشل في الإضافة: " + err.message });
  }
});

// === الكود المعدل هنا ===
router.get("/search", async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    
    if (from || to) {
      query.createdAt = {};
      
      // تحويل التواريخ إلى كائنات Date
      if (from) {
        const startDate = new Date(from);
        // التأكد من أن التاريخ صالح
        if (!isNaN(startDate.getTime())) {
          query.createdAt.$gte = startDate;
        }
      }
      
      if (to) {
        // إنشاء نسخة من تاريخ الانتهاء
        const endDate = new Date(to);
        // التأكد من أن التاريخ صالح
        if (!isNaN(endDate.getTime())) {
          // أضف يومًا واحدًا إلى تاريخ الانتهاء
          endDate.setDate(endDate.getDate() + 1);
          // ابحث عن التواريخ التي أقل من بداية اليوم التالي
          query.createdAt.$lt = endDate;
        }
      }
    }
    
    const rows = await CashBoxTransaction.find(query).sort({ createdAt: -1 });
    res.json(rows.map(row => ({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      documentId: row.documentId,
      createdAt: row.createdAt,
    })));
  } catch (err) {
    console.error("Error in cashbox SEARCH:", err);
    res.status(500).json({ error: "فشل في البحث" });
  }
});
// === نهاية الكود المعدل ===

// مسار لجلب حركة معينة بالمعرف
router.get("/:id", async (req, res) => {
  try {
    const row = await CashBoxTransaction.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "غير موجود" });
    res.json({
      id: row._id,
      amount: row.amount,
      details: row.details,
      type: row.type,
      documentId: row.documentId,
      createdAt: row.createdAt,
    });
  } catch (err) {
    console.error("Error in cashbox GET by ID:", err);
    res.status(500).json({ error: "فشل في جلب البيانات" });
  }
});

// مسار لتعديل حركة موجودة
router.put("/:id", async (req, res) => {
  try {
    let amount = Number(req.body.amount);
    const details = req.body.details;
    const type = req.body.type;
    if (!amount || isNaN(amount) || !details || !type)
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    amount = Math.abs(amount);
    const row = await CashBoxTransaction.findById(req.params.id);
    if (row && row.documentId) {
      return res.status(403).json({ error: "لا يمكن تعديل حركة مرتبطة بمستند" });
    }
    const updated = await CashBoxTransaction.findByIdAndUpdate(
      req.params.id,
      { amount, details, type },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "غير موجود" });
    res.json({
      id: updated._id,
      amount: updated.amount,
      details: updated.details,
      type: updated.type,
      documentId: updated.documentId,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error("Error in cashbox PUT:", err);
    res.status(500).json({ error: "فشل في التعديل" });
  }
});

// مسار لحذف حركة موجودة
router.delete("/:id", async (req, res) => {
  try {
    const row = await CashBoxTransaction.findById(req.params.id);
    if (row && row.documentId) {
      return res.status(403).json({ error: "لا يمكن حذف حركة مرتبطة بمستند" });
    }
    const deleted = await CashBoxTransaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "غير موجود" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in cashbox DELETE:", err);
    res.status(500).json({ error: "فشل في الحذف" });
  }
});

export default router;