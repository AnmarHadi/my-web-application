import express from "express";
import DocumentType from "../models/DocumentType.model.js";
const router = express.Router();

// جلب جميع أنواع المستندات
router.get("/", async (req, res) => {
  try {
    const docs = await DocumentType.find().sort({ createdAt: 1 });
    res.json(docs.map((doc) => ({
      id: doc._id,
      name: doc.name
    })));
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب الأنواع" });
  }
});

// إضافة نوع مستند جديد
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم نوع المستند مطلوب" });
    }
    if (await DocumentType.findOne({ name })) {
      return res.status(409).json({ error: "اسم النوع موجود مسبقاً" });
    }
    const doc = await DocumentType.create({ name: name.trim() });
    res.status(201).json({ id: doc._id, name: doc.name });
  } catch (err) {
    res.status(500).json({ error: "فشل في الإضافة" });
  }
});

// تعديل نوع مستند
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم نوع المستند مطلوب" });
    }
    if (await DocumentType.findOne({ name, _id: { $ne: req.params.id } })) {
      return res.status(409).json({ error: "اسم النوع مستخدم مسبقاً" });
    }
    const doc = await DocumentType.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true });
    if (!doc) return res.status(404).json({ error: "لم يتم العثور على النوع" });
    res.json({ id: doc._id, name: doc.name });
  } catch (err) {
    res.status(500).json({ error: "فشل في التعديل" });
  }
});

// حذف نوع مستند
router.delete("/:id", async (req, res) => {
  try {
    const doc = await DocumentType.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "النوع غير موجود" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "فشل في الحذف" });
  }
});

export default router;
