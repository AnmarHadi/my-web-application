import express from "express";
import Location from "../models/Location.model.js";
const router = express.Router();

// جلب (بحث)
router.get("/", async (req, res) => {
  try {
    const { name, province, operationType } = req.query;
    let filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (province) filter.province = province;
    if (operationType) filter.operationType = operationType;
    const data = await Location.find(filter).sort({ createdAt: 1 });
    res.json(data.map(row => ({
      id: row._id,
      name: row.name,
      province: row.province,
      operationType: row.operationType
    })));
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب البيانات" });
  }
});

// إضافة
router.post("/", async (req, res) => {
  try {
    const { name, province, operationType } = req.body;
    if (!name || !province || !operationType) return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    // منع التكرار لنفس المحافظة ولنفس نوع العملية ولنفس الاسم
    if (await Location.findOne({ name, province, operationType }))
      return res.status(409).json({ error: "الموقع موجود بالفعل لنفس نوع العملية والمحافظة" });
    const row = await Location.create({ name: name.trim(), province, operationType });
    res.status(201).json({ id: row._id, name: row.name, province: row.province, operationType: row.operationType });
  } catch (err) {
    res.status(500).json({ error: "فشل في الإضافة" });
  }
});

// تعديل
router.put("/:id", async (req, res) => {
  try {
    const { name, province, operationType } = req.body;
    if (!name || !province || !operationType) return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    if (await Location.findOne({ name, province, operationType, _id: { $ne: req.params.id } }))
      return res.status(409).json({ error: "الموقع موجود بالفعل لنفس نوع العملية والمحافظة" });
    const row = await Location.findByIdAndUpdate(req.params.id, { name: name.trim(), province, operationType }, { new: true });
    if (!row) return res.status(404).json({ error: "غير موجود" });
    res.json({ id: row._id, name: row.name, province: row.province, operationType: row.operationType });
  } catch (err) {
    res.status(500).json({ error: "فشل في التعديل" });
  }
});

// حذف
router.delete("/:id", async (req, res) => {
  try {
    const row = await Location.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ error: "غير موجود" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "فشل في الحذف" });
  }
});

export default router;
